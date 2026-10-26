import { describe, expect, it } from "vitest";
import { confirmLegalDocuments, CURRENT_LEGAL_MANIFEST, emptyLegalState, mergeLegalManifests, normalizeLegalState, parseLegalManifest, pendingLegalDocuments } from "@nowly/shared/legal";

const recordedAt = "2026-10-16T12:00:00.000Z";
const { tos: TOS, privacy: PRIVACY } = CURRENT_LEGAL_MANIFEST.documents;

const currentConfirmation = () => ({
  versions: {
    tos: TOS.version,
    privacy: PRIVACY.version
  },
  acceptTos: true,
  acknowledgePrivacy: true
});

const accepted = () => confirmLegalDocuments(emptyLegalState(), currentConfirmation(), recordedAt).state;

describe("legal documents", () => {
  it("requires both documents on first launch", () => {
    expect(pendingLegalDocuments(emptyLegalState())).toEqual(["tos", "privacy"]);
  });

  it("records separate receipts without analytics consent", () => {
    const state = accepted();
    expect(state.tosAcceptance).toEqual({
      version: TOS.version,
      recordedAt
    });
    expect(state.privacyAcknowledgement).toEqual({
      version: PRIVACY.version,
      recordedAt
    });
    expect(pendingLegalDocuments(state)).toEqual([]);
    expect(state).not.toHaveProperty("analyticsConsent");
  });

  it("does not accept unchecked confirmations", () => {
    const state = emptyLegalState();

    for (const input of [
      {
        acceptTos: false,
        acknowledgePrivacy: true
      },
      {
        acceptTos: true,
        acknowledgePrivacy: false
      }
    ]) {
      const result = confirmLegalDocuments(state, { ...currentConfirmation(), ...input }, recordedAt);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("confirmationRequired");
      expect(result.state).toBe(state);
    }
  });

  it("ignores minor changes for previously accepted versions", () => {
    const state = accepted();
    state.manifest = structuredClone(state.manifest);
    state.manifest.documents.tos.version = TOS.version + 1;
    expect(pendingLegalDocuments(state)).toEqual([]);
  });

  it("accepts a receipt at the required version without the latest version", () => {
    const state = accepted();
    state.tosAcceptance = {
      version: TOS.requiredVersion,
      recordedAt
    };
    expect(pendingLegalDocuments(state)).toEqual([]);
  });

  it.each(["tos", "privacy"] as const)("only requests the changed %s document", (id) => {
    const current = CURRENT_LEGAL_MANIFEST.documents[id].version;
    const next = current + 1;
    const state = accepted();
    state.manifest = structuredClone(state.manifest);
    state.manifest.documents[id] = {
      ...state.manifest.documents[id],
      version: next,
      requiredVersion: next
    };
    expect(pendingLegalDocuments(state)).toEqual([id]);
    const result = confirmLegalDocuments(
      state,
      {
        versions: { [id]: next },
        acceptTos: id === "tos",
        acknowledgePrivacy: id === "privacy"
      },
      "2026-10-17T00:00:00.000Z"
    );
    expect(result.ok).toBe(true);
    expect(pendingLegalDocuments(result.state)).toEqual([]);
    const other = id === "tos" ? result.state.privacyAcknowledgement : result.state.tosAcceptance;
    expect(other).toEqual({
      version: id === "tos" ? PRIVACY.version : TOS.version,
      recordedAt
    });
  });

  it("rejects a stale confirmation after a remote update", () => {
    const state = emptyLegalState();
    state.manifest = structuredClone(state.manifest);
    state.manifest.documents.tos.version = TOS.version + 1;
    expect(confirmLegalDocuments(state, currentConfirmation(), recordedAt).error).toBe("documentsChanged");
  });

  it("never rolls back a known version or required version", () => {
    const newer = structuredClone(CURRENT_LEGAL_MANIFEST);
    newer.documents.tos = {
      ...newer.documents.tos,
      version: TOS.version + 1,
      requiredVersion: TOS.requiredVersion + 1
    };
    expect(mergeLegalManifests(newer, CURRENT_LEGAL_MANIFEST)).toEqual(newer);
    const invalid = structuredClone(newer);
    invalid.documents.tos.requiredVersion = TOS.requiredVersion;
    expect(mergeLegalManifests(newer, invalid)).toEqual(newer);
  });

  it("rejects malformed manifests and external document URLs", () => {
    expect(parseLegalManifest(CURRENT_LEGAL_MANIFEST)).toEqual(CURRENT_LEGAL_MANIFEST);

    for (const value of [
      null,
      [],
      { schemaVersion: 2 },
      {
        schemaVersion: 1,
        documents: {}
      }
    ])
      expect(parseLegalManifest(value)).toBeNull();

    for (const override of [
      { version: 0 },
      { version: 1.5 },
      { requiredVersion: TOS.version + 1 },
      { requiredVersion: 0 },
      { path: "https://evil.example/tos" },
      { updatedAt: "yesterday" }
    ]) {
      const value = structuredClone(CURRENT_LEGAL_MANIFEST);
      Object.assign(value.documents.tos, override);
      expect(parseLegalManifest(value)).toBeNull();
    }
  });

  it("accepts a required version equal to the latest version", () => {
    const value = structuredClone(CURRENT_LEGAL_MANIFEST);
    value.documents.tos.requiredVersion = value.documents.tos.version;
    expect(parseLegalManifest(value)).toEqual(value);
  });

  it("recovers safely from corrupt storage", () => {
    expect(normalizeLegalState(null)).toEqual(emptyLegalState());
    expect(
      pendingLegalDocuments(
        normalizeLegalState({
          tosAcceptance: {
            version: -1,
            recordedAt
          },
          privacyAcknowledgement: {
            version: 1,
            recordedAt: "bad"
          },
          checkedAt: NaN
        })
      )
    ).toEqual(["tos", "privacy"]);
  });

  it("retains local receipts across service worker restarts", () => {
    expect(normalizeLegalState(JSON.parse(JSON.stringify(accepted())))).toEqual(accepted());
  });
});