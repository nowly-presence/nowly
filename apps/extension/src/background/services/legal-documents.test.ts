import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_LEGAL_MANIFEST, pendingLegalDocuments } from "@nowly/shared/legal";
import { installChromeMock } from "@/test/chrome-mock";
import { acceptLegalDocuments, checkLegalDocuments, getLegalState } from "@/background/services/legal-documents";

const confirmation = () => ({
  versions: {
    tos: CURRENT_LEGAL_MANIFEST.documents.tos.version,
    privacy: CURRENT_LEGAL_MANIFEST.documents.privacy.version
  },
  acceptTos: true,
  acknowledgePrivacy: true
});

describe("legal version checks", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    installChromeMock();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("fetches the public manifest without credentials and caches the result", async () => {
    fetchMock.mockResolvedValue(Response.json(CURRENT_LEGAL_MANIFEST));
    const result = await checkLegalDocuments();
    expect(result.checkFailed).toBe(false);
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

  it("keeps bundled versions usable offline and backs off retries", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const state = await checkLegalDocuments();
    expect(state.checkFailed).toBe(true);
    expect(pendingLegalDocuments(state)).toEqual(["tos", "privacy"]);
    const result = await acceptLegalDocuments(confirmation());
    expect(result.ok).toBe(true);
    expect(pendingLegalDocuments(await checkLegalDocuments())).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a malformed remote response without losing local receipts", async () => {
    await acceptLegalDocuments(confirmation());
    fetchMock.mockResolvedValue(Response.json({ schemaVersion: 99 }));
    const state = await checkLegalDocuments();
    expect(state.checkFailed).toBe(true);
    expect(pendingLegalDocuments(state)).toEqual([]);
  });

  it("serializes a remote update with confirmation to reject stale UI", async () => {
    const next = structuredClone(CURRENT_LEGAL_MANIFEST);
    const bumped = next.documents.privacy.version + 1;
    next.documents.privacy = {
      ...next.documents.privacy,
      version: bumped,
      requiredVersion: bumped
    };
    fetchMock.mockResolvedValue(Response.json(next));
    const check = checkLegalDocuments();
    const pending = acceptLegalDocuments(confirmation());
    await check;
    expect((await pending).error).toBe("documentsChanged");
    expect((await getLegalState()).tosAcceptance).toBeNull();
  });
});