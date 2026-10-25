import { describe, expect, it } from "vitest";
import { confirmLegalDocuments, emptyLegalState, normalizeLegalState, parseLegalDates, pendingLegalDocuments } from "@nowly/shared/legal";

const dates = {
  tos: "2026-10-24",
  privacy: "2026-10-25"
};
const recordedAt = "2026-10-25T12:00:00.000Z";

const current = () => ({
  ...emptyLegalState(),
  dates: { ...dates }
});

const accepted = () =>
  confirmLegalDocuments(
    current(),
    {
      dates,
      acceptTos: true,
      acknowledgePrivacy: true
    },
    recordedAt
  ).state;

describe("legal document dates", () => {
  it("requires both documents on first launch and cannot confirm unknown dates", () => {
    expect(pendingLegalDocuments(emptyLegalState())).toEqual(["tos", "privacy"]);
    expect(
      confirmLegalDocuments(
        emptyLegalState(),
        {
          dates,
          acceptTos: true,
          acknowledgePrivacy: true
        },
        recordedAt
      ).ok
    ).toBe(false);
  });

  it("records separate dated receipts without analytics consent", () => {
    const state = accepted();
    expect(state.tosAcceptance).toEqual({
      date: dates.tos,
      recordedAt
    });
    expect(state.privacyAcknowledgement).toEqual({
      date: dates.privacy,
      recordedAt
    });
    expect(pendingLegalDocuments(state)).toEqual([]);
    expect(state).not.toHaveProperty("analyticsConsent");
    expect(state).not.toHaveProperty("manifest");
  });

  it("does not accept unchecked confirmations", () => {
    for (const id of ["tos", "privacy"]) {
      const state = current();
      const result = confirmLegalDocuments(
        state,
        {
          dates,
          acceptTos: id !== "tos",
          acknowledgePrivacy: id !== "privacy"
        },
        recordedAt
      );
      expect(result.error).toBe("confirmationRequired");
      expect(result.state).toBe(state);
    }
  });

  it.each(["tos", "privacy"] as const)("only requests the changed %s document", (id) => {
    const state = accepted();
    state.dates = {
      ...dates,
      [id]: "2026-10-26"
    };
    expect(pendingLegalDocuments(state)).toEqual([id]);
    const result = confirmLegalDocuments(
      state,
      {
        dates: { [id]: "2026-10-26" },
        acceptTos: id === "tos",
        acknowledgePrivacy: id === "privacy"
      },
      recordedAt
    );
    expect(result.ok).toBe(true);
    expect(pendingLegalDocuments(result.state)).toEqual([]);
    expect(id === "tos" ? result.state.privacyAcknowledgement : result.state.tosAcceptance).toEqual({
      date: dates[id === "tos" ? "privacy" : "tos"],
      recordedAt
    });
  });

  it("rejects a stale confirmation after a remote update", () => {
    const state = current();
    state.dates.privacy = "2026-10-26";
    expect(
      confirmLegalDocuments(
        state,
        {
          dates,
          acceptTos: true,
          acknowledgePrivacy: true
        },
        recordedAt
      ).error
    ).toBe("documentsChanged");
  });

  it("rejects malformed dates, impossible days and the old numbered manifest", () => {
    expect(parseLegalDates(dates)).toEqual(dates);

    for (const value of [
      null,
      [],
      {},
      { tos: dates.tos },
      {
        ...dates,
        tos: "yesterday"
      },
      {
        ...dates,
        privacy: "2026-02-30"
      },
      {
        ...dates,
        tos: "https://evil.example/tos"
      },
      {
        schemaVersion: 1,
        documents: {}
      }
    ]) {
      expect(parseLegalDates(value)).toBeNull();
    }
  });

  it("recovers safely from corrupt storage and requests confirmation after migration from numbered receipts", () => {
    expect(normalizeLegalState(null)).toEqual(emptyLegalState());
    const state = normalizeLegalState({
      manifest: {
        schemaVersion: 1,
        documents: {}
      },
      tosAcceptance: {
        version: 2,
        recordedAt
      },
      privacyAcknowledgement: {
        date: dates.privacy,
        recordedAt: "bad"
      },
      checkedAt: Date.now()
    });
    expect(state.checkedAt).toBe(0);
    expect(state.tosAcceptance).toBeNull();
    expect(state.privacyAcknowledgement).toBeNull();
    expect(pendingLegalDocuments(state)).toEqual(["tos", "privacy"]);
  });

  it("retains cached dates and receipts across service worker restarts", () => {
    expect(normalizeLegalState(JSON.parse(JSON.stringify(accepted())))).toEqual(accepted());
  });
});