export const LEGAL_DOCUMENT_IDS = ["tos", "privacy"] as const;

export type LegalDocumentId = (typeof LEGAL_DOCUMENT_IDS)[number];
export type LegalDates = Record<LegalDocumentId, string>;
export type LegalReceipt = {
  date: string;
  recordedAt: string;
};
export type LegalState = {
  dates: LegalDates | null;
  tosAcceptance: LegalReceipt | null;
  privacyAcknowledgement: LegalReceipt | null;
  checkedAt: number;
  checkFailed: boolean;
};
export type LegalConfirmation = {
  dates: Partial<LegalDates>;
  acceptTos: boolean;
  acknowledgePrivacy: boolean;
};
export type LegalConfirmationResult = {
  ok: boolean;
  state: LegalState;
  error?: "documentsChanged" | "confirmationRequired";
};

export const objectValue = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const isDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export const parseLegalDates = (value: unknown): LegalDates | null => {
  const dates = objectValue(value);
  return isDate(dates?.tos) && isDate(dates?.privacy) ? { tos: dates.tos, privacy: dates.privacy } : null;
};

export const emptyLegalState = (): LegalState => ({
  dates: null,
  tosAcceptance: null,
  privacyAcknowledgement: null,
  checkedAt: 0,
  checkFailed: false
});

const parseReceipt = (value: unknown): LegalReceipt | null => {
  const receipt = objectValue(value);
  return isDate(receipt?.date) && typeof receipt.recordedAt === "string" && Number.isFinite(Date.parse(receipt.recordedAt))
    ? { date: receipt.date, recordedAt: receipt.recordedAt }
    : null;
};

export const normalizeLegalState = (value: unknown): LegalState => {
  const stored = objectValue(value);
  const dates = parseLegalDates(stored?.dates);
  return {
    dates,
    tosAcceptance: parseReceipt(stored?.tosAcceptance),
    privacyAcknowledgement: parseReceipt(stored?.privacyAcknowledgement),
    checkedAt:
      (dates || stored?.checkFailed === true) && typeof stored?.checkedAt === "number" && Number.isFinite(stored.checkedAt) && stored.checkedAt >= 0
        ? stored.checkedAt
        : 0,
    checkFailed: stored?.checkFailed === true
  };
};

export const pendingLegalDocuments = (state: LegalState): LegalDocumentId[] =>
  LEGAL_DOCUMENT_IDS.filter((id) => !state.dates || (id === "tos" ? state.tosAcceptance : state.privacyAcknowledgement)?.date !== state.dates[id]);

export const confirmLegalDocuments = (state: LegalState, input: LegalConfirmation, now: string): LegalConfirmationResult => {
  const pending = pendingLegalDocuments(state);

  if (!state.dates || pending.some((id) => input.dates?.[id] !== state.dates?.[id])) return {
    ok: false,
    state,
    error: "documentsChanged"
  };
  if (pending.some((id) => (id === "tos" ? input.acceptTos !== true : input.acknowledgePrivacy !== true))) return {
    ok: false,
    state,
    error: "confirmationRequired"
  };

  return {
    ok: true,
    state: {
      ...state,
      tosAcceptance: pending.includes("tos") ? { date: state.dates.tos, recordedAt: now } : state.tosAcceptance,
      privacyAcknowledgement: pending.includes("privacy") ? { date: state.dates.privacy, recordedAt: now } : state.privacyAcknowledgement
    }
  };
};