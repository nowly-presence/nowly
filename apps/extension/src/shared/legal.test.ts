import { describe, expect, it } from "vitest";
import { confirmLegalDocuments, CURRENT_LEGAL_MANIFEST, emptyLegalState, mergeLegalManifests, normalizeLegalState, parseLegalManifest, pendingLegalDocuments } from "@nowly/shared/legal";

const recordedAt = "2026-10-16T12:00:00.000Z";

const accepted = () =>
  confirmLegalDocuments(
    emptyLegalState(),
    {
      versions: {
        tos: 1,
        privacy: 1
      },
      acceptTos: true,
      acknowledgePrivacy: true
    },
    recordedAt
  ).state;

describe("legal documents", () => {
  it("requires both documents on first launch", () => {
    expect(pendingLegalDocuments(emptyLegalState())).toEqual(["tos", "privacy"]);
  });

  it("records separate receipts without analytics consent", () => {
    const state = accepted();
    expect(state.tosAcceptance).toEqual({
      version: 1,
      recordedAt
    });
    expect(state.privacyAcknowledgement).toEqual({
      version: 1,
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
      const result = confirmLegalDocuments(
        state,
        {
          versions: {
            tos: 1,
            privacy: 1
          },
          ...input
        },
        recordedAt
      );
      expect(result.ok).toBe(false);
      expect(result.state).toBe(state);
    }
  });

  it("ignores minor changes for previously accepted versions", () => {
    const state = accepted();
    state.manifest = structuredClone(state.manifest);
    state.manifest.documents.tos.version = 2;
    expect(pendingLegalDocuments(state)).toEqual([]);
  });

  it.each(["tos", "privacy"] as const)("only requests the changed %s document", (id) => {
    const state = accepted();
    state.manifest = structuredClone(state.manifest);
    state.manifest.documents[id] = {
      ...state.manifest.documents[id],
      version: 3,
      requiredVersion: 2
    };
    expect(pendingLegalDocuments(state)).toEqual([id]);
    const result = confirmLegalDocuments(
      state,
      {
        versions: { [id]: 3 },
        acceptTos: id === "tos",
        acknowledgePrivacy: id === "privacy"
      },
      "2026-10-17T00:00:00.000Z"
    );
    expect(result.ok).toBe(true);
    expect(pendingLegalDocuments(result.state)).toEqual([]);
    expect(id === "tos" ? result.state.privacyAcknowledgement : result.state.tosAcceptance).toEqual({
      version: 1,
      recordedAt
    });
  });

  it("rejects a stale confirmation after a remote update", () => {
    const state = emptyLegalState();
    state.manifest = structuredClone(state.manifest);
    state.manifest.documents.tos.version = 2;
    expect(
      confirmLegalDocuments(
        state,
        {
          versions: {
            tos: 1,
            privacy: 1
          },
          acceptTos: true,
          acknowledgePrivacy: true
        },
        recordedAt
      ).error
    ).toBe("documentsChanged");
  });

  it("never rolls back a known version or required version", () => {
    const newer = structuredClone(CURRENT_LEGAL_MANIFEST);
    newer.documents.tos = {
      ...newer.documents.tos,
      version: 3,
      requiredVersion: 2
    };
    expect(mergeLegalManifests(newer, CURRENT_LEGAL_MANIFEST)).toEqual(newer);
    const invalid = structuredClone(newer);
    invalid.documents.tos.requiredVersion = 1;
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
      { requiredVersion: 2 },
      { path: "https://evil.example/tos" },
      { updatedAt: "yesterday" }
    ]) {
      const value = structuredClone(CURRENT_LEGAL_MANIFEST);
      Object.assign(value.documents.tos, override);
      expect(parseLegalManifest(value)).toBeNull();
    }
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