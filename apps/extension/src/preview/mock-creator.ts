import { SUBMISSION_TIMELINE, type CreatorAccount } from "@nowly/presence-creator/creator-submission";
import type { AccountUser } from "@/shared/types";
import type { CreatorPick, CreatorReadMode, CreatorSubmission } from "@nowly/presence-creator/creator-types";
import type { MockHandlers } from "@/preview/mock-router";

const PICK_LATENCY_MS = 900;
const PREVIEW_PAGE_URL = "https://www.example-tube.com/watch?v=lofi";
const PREVIEW_PR_URL = "https://github.com/nowly-presence/presences/pulls";

const SAMPLE_PICKS: Omit<CreatorPick, "at">[] = [
  {
    selector: "h1.video-title",
    text: "Lo-fi beats to relax and study",
    tag: "h1"
  },
  {
    selector: "#owner a.channel-link",
    text: "Nowly Radio",
    link: "https://www.example-tube.com/@nowlyradio",
    tag: "a"
  },
  {
    selector: "img.video-thumbnail",
    image: "https://picsum.photos/seed/nowly/640/360",
    tag: "img"
  }
];

const sampleValue = (selector: string, read: CreatorReadMode): string | undefined => {
  const pick = SAMPLE_PICKS.find((entry) => entry.selector === selector);
  return read === "image" ? pick?.image : read === "link" ? pick?.link : pick?.text;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type MockCreatorAccount = {
  user: () => AccountUser | null;
  signIn: () => void;
};

export const createMockCreatorHandlers = (account: MockCreatorAccount): MockHandlers => {
  let creator = false;
  let pickIndex = 0;
  const submissions = new Map<string, CreatorSubmission>();
  const readAccount = (): CreatorAccount | null => {
    const user = account.user();
    return user ? { user, creator } : null;
  };
  return {
    CREATOR_GET_ACCOUNT: readAccount,
    START_CREATOR_CONNECT: () => {
      account.signIn();
      creator = true;
      return {
        ok: true
      };
    },
    CREATOR_SUBMIT: async () => {
      if (!readAccount()?.creator) return {
        ok: false,
        error: "CREATOR_REQUIRED"
      };

      await delay(PICK_LATENCY_MS);
      const submission: CreatorSubmission = {
        id: crypto.randomUUID().slice(0, 8),
        status: "submitted",
        updatedAt: Date.now()
      };
      submissions.set(submission.id, submission);
      return {
        ok: true,
        submission
      };
    },
    CREATOR_FETCH_SUBMISSIONS: ({ ids }) =>
      ids.flatMap((id) => {
        const current = submissions.get(id);

        if (!current) return [];

        const nextStatus = SUBMISSION_TIMELINE[Math.min(SUBMISSION_TIMELINE.length - 1, SUBMISSION_TIMELINE.indexOf(current.status) + 1)];
        const next: CreatorSubmission = {
          ...current,
          status: nextStatus,
          updatedAt: Date.now(),
          prUrl: nextStatus === "in_progress" || nextStatus === "published" ? PREVIEW_PR_URL : undefined
        };
        submissions.set(id, next);
        return [next];
      }),
    CREATOR_PICK_START: async () => {
      await delay(PICK_LATENCY_MS);
      const pick = SAMPLE_PICKS[pickIndex % SAMPLE_PICKS.length];
      pickIndex += 1;
      return {
        ok: true,
        pick: {
          ...pick,
          at: Date.now()
        }
      };
    },
    CREATOR_PICK_CANCEL: () => ({ ok: true }),
    CREATOR_HIGHLIGHT: () => ({ ok: true }),
    CREATOR_TEST_ACTIVITY: () => ({ ok: true }),
    CREATOR_EXTRACT: ({ variables }) => ({
      ok: true,
      extraction: {
        url: PREVIEW_PAGE_URL,
        values: variables.map((variable) => ({
          variableId: variable.id,
          value:
            variable.source.kind === "element"
              ? (sampleValue(variable.source.selector, variable.source.read) ?? variable.sample)
              : variable.source.kind === "tabTitle"
                ? "Lo-fi beats to relax and study | Example Tube"
                : variable.source.property === "og:image"
                  ? "https://picsum.photos/seed/nowly/640/360"
                  : "Lo-fi beats to relax and study"
        })),
        media: {
          currentTime: 83,
          duration: 3600,
          paused: false
        }
      }
    })
  };
};