export const LEGAL_DOCUMENT_IDS = ["tos", "privacy"] as const;

export type LegalDocumentId = (typeof LEGAL_DOCUMENT_IDS)[number];

export type LegalDocument = {
  version: number;
  requiredVersion: number;
  updatedAt: string;
  path: "/tos" | "/privacy";
};

export type LegalManifest = {
  schemaVersion: 1;
  documents: Record<LegalDocumentId, LegalDocument>;
};

export const CURRENT_LEGAL_MANIFEST: LegalManifest = {
  schemaVersion: 1,
  documents: {
    tos: {
      version: 2,
      requiredVersion: 1,
      updatedAt: "2026-10-24",
      path: "/tos"
    },
    privacy: {
      version: 1,
      requiredVersion: 1,
      updatedAt: "2026-10-16",
      path: "/privacy"
    }
  }
};

export type LegalReceipt = {
  version: number;
  recordedAt: string;
};
export type LegalState = {
  manifest: LegalManifest;
  tosAcceptance: LegalReceipt | null;
  privacyAcknowledgement: LegalReceipt | null;
  checkedAt: number;
  checkFailed: boolean;
};

export type LegalConfirmation = {
  versions: Partial<Record<LegalDocumentId, number>>;
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

export const parseLegalManifest = (value: unknown): LegalManifest | null => {
  const root = objectValue(value);
  const documents = objectValue(root?.documents);

  if (root?.schemaVersion !== 1 || !documents) return null;

  const parsed: Partial<Record<LegalDocumentId, LegalDocument>> = {};

  for (const id of LEGAL_DOCUMENT_IDS) {
    const item = objectValue(documents[id]);

    if (
      !item ||
      typeof item.version !== "number" ||
      !Number.isSafeInteger(item.version) ||
      item.version < 1 ||
      typeof item.requiredVersion !== "number" ||
      !Number.isSafeInteger(item.requiredVersion) ||
      item.requiredVersion < 1 ||
      item.requiredVersion > item.version ||
      typeof item.updatedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.updatedAt) ||
      !Number.isFinite(Date.parse(item.updatedAt)) ||
      item.path !== `/${id}`
    ) return null;

    parsed[id] = {
      version: item.version,
      requiredVersion: item.requiredVersion,
      updatedAt: item.updatedAt,
      path: id === "tos" ? "/tos" : "/privacy"
    };
  }

  if (!parsed.tos || !parsed.privacy) return null;

  return {
    schemaVersion: 1,
    documents: {
      tos: parsed.tos,
      privacy: parsed.privacy
    }
  };
};

export const mergeLegalManifests = (current: LegalManifest, incoming: LegalManifest): LegalManifest => {
  const documents = { ...current.documents };

  for (const id of LEGAL_DOCUMENT_IDS) {
    const next = incoming.documents[id];
    const previous = current.documents[id];
    if (next.version >= previous.version && next.requiredVersion >= previous.requiredVersion && next.updatedAt >= previous.updatedAt) documents[id] = next;
  }

  return {
    schemaVersion: 1,
    documents
  };
};

export const pendingLegalDocuments = (state: LegalState): LegalDocumentId[] =>
  LEGAL_DOCUMENT_IDS.filter((id) => {
    const receipt = id === "tos" ? state.tosAcceptance : state.privacyAcknowledgement;
    return !receipt || receipt.version < state.manifest.documents[id].requiredVersion;
  });

export const emptyLegalState = (): LegalState => ({
  manifest: CURRENT_LEGAL_MANIFEST,
  tosAcceptance: null,
  privacyAcknowledgement: null,
  checkedAt: 0,
  checkFailed: false
});

export const parseLegalReceipt = (value: unknown): LegalReceipt | null => {
  const receipt = objectValue(value);
  return receipt &&
    typeof receipt.version === "number" &&
    Number.isSafeInteger(receipt.version) &&
    receipt.version > 0 &&
    typeof receipt.recordedAt === "string" &&
    Number.isFinite(Date.parse(receipt.recordedAt))
    ? { version: receipt.version, recordedAt: receipt.recordedAt }
    : null;
};

export const normalizeLegalState = (value: unknown): LegalState => {
  const stored = objectValue(value);
  const manifest = parseLegalManifest(stored?.manifest);
  return {
    manifest: manifest ? mergeLegalManifests(CURRENT_LEGAL_MANIFEST, manifest) : CURRENT_LEGAL_MANIFEST,
    tosAcceptance: parseLegalReceipt(stored?.tosAcceptance),
    privacyAcknowledgement: parseLegalReceipt(stored?.privacyAcknowledgement),
    checkedAt: typeof stored?.checkedAt === "number" && Number.isFinite(stored.checkedAt) && stored.checkedAt >= 0 ? stored.checkedAt : 0,
    checkFailed: stored?.checkFailed === true
  };
};

export const confirmLegalDocuments = (state: LegalState, input: LegalConfirmation, now: string): LegalConfirmationResult => {
  const pending = pendingLegalDocuments(state);

  if (pending.some((id) => input.versions?.[id] !== state.manifest.documents[id].version)) return {
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
      tosAcceptance: pending.includes("tos") ? { version: state.manifest.documents.tos.version, recordedAt: now } : state.tosAcceptance,
      privacyAcknowledgement: pending.includes("privacy")
        ? { version: state.manifest.documents.privacy.version, recordedAt: now }
        : state.privacyAcknowledgement
    }
  };
};
