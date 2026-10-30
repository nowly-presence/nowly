import { confirmLegalDocuments, normalizeLegalState, parseLegalDates, pendingLegalDocuments, type LegalConfirmation, type LegalConfirmationResult, type LegalState } from "@nowly/shared/legal";
import { WEB_BASE_URL } from "@/shared/constants";
import { STORAGE_KEYS } from "@/background/storage/keys";

const LEGAL_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const LEGAL_RETRY_INTERVAL_MS = 5 * 60 * 1000;
const LEGAL_REQUEST_TIMEOUT_MS = 5000;
let work: Promise<unknown> = Promise.resolve();

const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
  const next = work.then(operation, operation);
  work = next.catch(() => {});
  return next;
};

export const getLegalState = async (): Promise<LegalState> => {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.legal);
  return normalizeLegalState(stored[STORAGE_KEYS.legal]);
};

const saveLegalState = async (state: LegalState): Promise<void> => {
  await chrome.storage.local.set({ [STORAGE_KEYS.legal]: state });
};

export const checkLegalDocuments = ({
  force = false
}: {
  force?: boolean;
} = {}): Promise<LegalState> =>
  serialize(async () => {
    const current = await getLegalState();

    const age = Date.now() - current.checkedAt;
    const interval = current.checkFailed ? LEGAL_RETRY_INTERVAL_MS : LEGAL_CHECK_INTERVAL_MS;

    if (!force && current.checkedAt > 0 && age >= 0 && age < interval) return current;

    try {
      const response = await fetch(`${WEB_BASE_URL.replace(/\/$/, "")}/api/legal/versions`, {
        credentials: "omit",
        referrerPolicy: "no-referrer",
        redirect: "error",
        cache: "no-cache",
        signal: AbortSignal.timeout(LEGAL_REQUEST_TIMEOUT_MS)
      });

      if (!response.ok) throw new Error("LEGAL_REQUEST_FAILED");

      const dates = parseLegalDates(await response.json());

      if (!dates) throw new Error("LEGAL_DATES_INVALID");

      const next = {
        ...current,
        dates: {
          tos: current.dates && current.dates.tos > dates.tos ? current.dates.tos : dates.tos,
          privacy: current.dates && current.dates.privacy > dates.privacy ? current.dates.privacy : dates.privacy
        },
        checkedAt: Date.now(),
        checkFailed: false
      };
      await saveLegalState(next);
      return next;
    } catch {
      const next = {
        ...current,
        checkedAt: Date.now(),
        checkFailed: true
      };
      await saveLegalState(next);
      return next;
    }
  });

export const acceptLegalDocuments = (input: LegalConfirmation): Promise<LegalConfirmationResult> =>
  serialize(async () => {
    const current = await getLegalState();

    const result = confirmLegalDocuments(current, input, new Date().toISOString());
    if (result.ok) await saveLegalState(result.state);
    return result;
  });

export const legalDocumentsPending = async (): Promise<boolean> => pendingLegalDocuments(await getLegalState()).length > 0;