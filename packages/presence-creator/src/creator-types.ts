import type { LocaleString as LongLocale } from "@nowly/locales";

export type LocalizedText = Partial<Record<LongLocale, string>>;

export type CreatorCategory = "streaming" | "music" | "video" | "social" | "gaming" | "tools" | "ai" | "learning" | "creator" | "other";

export type CreatorTranslationMode = "manual" | "auto";

export type CreatorActivityType = "watching" | "listening" | "playing" | "competing";

export type CreatorMatchMode = "any" | "equals" | "startsWith" | "contains";

export type CreatorReadMode = "text" | "image" | "link";

export type CreatorMetaProperty = "og:title" | "og:description" | "og:image";

export type CreatorSource = {
  kind: "element";
  selector: string;
  read: CreatorReadMode;
} | {
  kind: "tabTitle";
} | {
  kind: "meta";
  property: CreatorMetaProperty;
};

export type CreatorVariable = {
  id: string;
  name: string;
  source: CreatorSource;
  sample?: string;
};

export type CreatorImage = {
  kind: "logo";
} | {
  kind: "variable";
  variableId: string;
} | {
  kind: "custom";
  template: string;
};

export type CreatorLink = {
  kind: "page";
} | {
  kind: "variable";
  variableId: string;
} | {
  kind: "custom";
  template: string;
};

export type CreatorButton = {
  id: string;
  label: LocalizedText;
  link: CreatorLink;
};

export type CreatorTimestamps = "media" | "elapsed";

export const CREATOR_CONDITION_OPERATORS = {
  text: ["contains", "notContains", "equals", "notEquals", "startsWith", "endsWith", "matches", "empty", "notEmpty"],
  number: ["gt", "gte", "lt", "lte", "eq", "neq", "between"],
  boolean: ["exists", "missing"]
} as const;

export type CreatorConditionType = keyof typeof CREATOR_CONDITION_OPERATORS;

export type CreatorConditionOperator = (typeof CREATOR_CONDITION_OPERATORS)[CreatorConditionType][number];

export type CreatorSmallImage = {
  kind: "icon";
} | {
  kind: "variable";
  variableId: string;
} | {
  kind: "custom";
  template: string;
};

export type CreatorTextActionKind = "details" | "state" | "activityName" | "imageText";

export type CreatorConditionAction = {
  id: string;
  kind: CreatorTextActionKind;
  text: LocalizedText;
} | {
  id: string;
  kind: "largeImage";
  image: CreatorImage;
} | {
  id: string;
  kind: "smallImage";
  image: CreatorSmallImage;
} | {
  id: string;
  kind: "activityType";
  activityType: CreatorActivityType;
} | {
  id: string;
  kind: "timestamps";
  timestamps: CreatorTimestamps;
} | {
  id: string;
  kind: "hideButton";
  buttonId: string;
} | {
  id: string;
  kind: "buttonLabel";
  buttonId: string;
  text: LocalizedText;
} | {
  id: string;
  kind: "buttonLink";
  buttonId: string;
  link: CreatorLink;
} | {
  id: string;
  kind: "hidePresence";
};

export type CreatorConditionActionKind = CreatorConditionAction["kind"];

export type CreatorCondition = {
  id: string;
  variableId: string;
  type: CreatorConditionType;
  operator: CreatorConditionOperator;
  value: string;
  valueMax: string;
  actions: CreatorConditionAction[];
  elseActions: CreatorConditionAction[];
};

export type CreatorPage = {
  id: string;
  name: string;
  match: {
    mode: CreatorMatchMode;
    path: string;
    extraPaths: string[];
  };
  activityType: CreatorActivityType;
  variables: CreatorVariable[];
  details: LocalizedText;
  state: LocalizedText;
  largeImage: CreatorImage;
  timestamps: CreatorTimestamps;
  buttons: CreatorButton[];
  conditions: CreatorCondition[];
};

export type CreatorAssets = {
  thumbnail?: string;
  logo?: string;
  icon?: string;
  iconTransparent?: boolean;
  thumbnailRightsConfirmed: boolean;
};

export const CREATOR_STEPS = ["visuals", "identity", "language", "texts", "pages", "review"] as const;

export type CreatorStep = (typeof CREATOR_STEPS)[number];

export type SubmissionStatus = "submitted" | "changes_requested" | "approved" | "in_progress" | "published" | "rejected";

export type CreatorSubmission = {
  id: string;
  status: SubmissionStatus;
  revision?: number;
  updatedAt: number;
  prUrl?: string;
  note?: string;
};

export type CreatorAuthor = {
  name: string;
  github?: string;
  discord?: string;
};

export type CreatorDraft = {
  id: string;
  createdAt: number;
  updatedAt: number;
  step: CreatorStep;
  assets: CreatorAssets;
  name: string;
  domains: string[];
  color: string;
  category: CreatorCategory;
  baseLocale: LongLocale;
  translationMode: CreatorTranslationMode;
  locales: LongLocale[];
  description: LocalizedText;
  longDescription: LocalizedText;
  features: LocalizedText[];
  pages: CreatorPage[];
  browsingFallback: boolean;
  author: CreatorAuthor;
  submission?: CreatorSubmission;
  sentSignature?: string;
};

export type CreatorExtractedValue = {
  variableId: string;
  value?: string;
};

export type CreatorMediaState = {
  currentTime: number;
  duration: number;
  paused: boolean;
};

export type CreatorExtraction = {
  url: string;
  pageId?: string;
  values: CreatorExtractedValue[];
  media?: CreatorMediaState;
};

export type CreatorPick = {
  selector: string;
  text?: string;
  image?: string;
  link?: string;
  tag: string;
  at: number;
};