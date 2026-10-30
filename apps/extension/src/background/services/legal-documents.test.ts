import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pendingLegalDocuments } from "@nowly/shared/legal";
import { installChromeMock } from "@/test/chrome-mock";
import { acceptLegalDocuments, checkLegalDocuments, getLegalState } from "@/background/services/legal-documents";

const dates = {
  tos: "2026-10-24",
  privacy: "2026-10-25"
};
const confirmation = {
  dates,
  acceptTos: true,
  acknowledgePrivacy: true
};

describe("legal date checks", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    installChromeMock();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("fetches document dates without credentials and caches the result", async () => {
    fetchMock.mockResolvedValue(Response.json(dates));
    const result = await checkLegalDocuments();
    expect(result.checkFailed).toBe(false);
    expect(result.dates).toEqual(dates);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/legal/versions"),
      expect.objectContaining({
        credentials: "omit",
        referrerPolicy: "no-referrer",
        redirect: "error"
      })
    );
    await checkLegalDocuments();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await getLegalState()).toEqual(result);
  });

  it("cannot confirm dates before a first successful fetch and backs off offline retries", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const state = await checkLegalDocuments();
    expect(state.checkFailed).toBe(true);
    expect(state.dates).toBeNull();
    expect((await acceptLegalDocuments(confirmation)).ok).toBe(false);
    await checkLegalDocuments();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lets a forced check bypass the offline backoff", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(Response.json(dates));
    expect((await checkLegalDocuments()).checkFailed).toBe(true);

    const state = await checkLegalDocuments({ force: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(state).toMatchObject({
      dates,
      checkFailed: false
    });
    expect(await getLegalState()).toEqual(state);
  });

  it("retains cached dates and confirmations offline without reverting to bundled values", async () => {
    await chrome.storage.local.set({
      legalDocuments: {
        dates,
        checkedAt: 0
      }
    });
    expect((await acceptLegalDocuments(confirmation)).ok).toBe(true);
    fetchMock.mockRejectedValue(new Error("offline"));
    const state = await checkLegalDocuments();
    expect(state.checkFailed).toBe(true);
    expect(state.dates).toEqual(dates);
    expect(pendingLegalDocuments(state)).toEqual([]);
  });

  it("rejects a malformed remote response without losing local receipts", async () => {
    await chrome.storage.local.set({
      legalDocuments: {
        dates,
        checkedAt: 0
      }
    });
    await acceptLegalDocuments(confirmation);
    fetchMock.mockResolvedValue(
      Response.json({
        privacy: "2026-02-30",
        tos: dates.tos
      })
    );
    const state = await checkLegalDocuments();
    expect(state.checkFailed).toBe(true);
    expect(pendingLegalDocuments(state)).toEqual([]);
  });

  it("never replaces a known document date with an older one", async () => {
    await chrome.storage.local.set({
      legalDocuments: {
        dates,
        checkedAt: 0
      }
    });
    fetchMock.mockResolvedValue(
      Response.json({
        tos: "2026-10-23",
        privacy: "2026-10-26"
      })
    );
    expect((await checkLegalDocuments()).dates).toEqual({
      ...dates,
      privacy: "2026-10-26"
    });
  });

  it("serializes a remote update with confirmation to reject stale UI", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        ...dates,
        privacy: "2026-10-26"
      })
    );
    const check = checkLegalDocuments();
    const result = acceptLegalDocuments(confirmation);
    await check;
    expect((await result).error).toBe("documentsChanged");
    expect((await getLegalState()).tosAcceptance).toBeNull();
  });
});