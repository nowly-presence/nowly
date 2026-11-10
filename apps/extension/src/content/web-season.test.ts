import { describe, expect, it } from "vitest";
import { startWebSeason } from "@/content/web-season";

const NOWLY = "https://nowly.me";
const OCTOBER = new Date(2026, 9, 12, 12);

type Posted = {
  message: unknown;
  targetOrigin: string;
};
type MessageListener = (event: { origin: string; source: unknown; data: unknown }) => void;
type ChangeListener = (changes: Record<string, unknown>, area: string) => void;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const setup = ({
  origin = NOWLY,
  local = {},
  date = OCTOBER
}: {
  origin?: string;
  local?: Record<string, unknown>;
  date?: Date;
} = {}) => {
  const posted: Posted[] = [];
  const messageListeners: MessageListener[] = [];
  const changeListeners: ChangeListener[] = [];
  const target = {
    location: { origin },
    postMessage: (message: unknown, targetOrigin: string) => posted.push({ message, targetOrigin }),
    addEventListener: (_type: "message", listener: MessageListener) => messageListeners.push(listener)
  };
  const storage = {
    get: async (keys: string[]) => Object.fromEntries(keys.map((key) => [key, local[key]])),
    onChanged: {
      addListener: (listener: ChangeListener) => changeListeners.push(listener)
    }
  };
  startWebSeason({
    target,
    storage,
    isAllowedOrigin: (value) => value === NOWLY,
    now: () => date
  });
  const change = async (values: Record<string, unknown>) => {
    Object.assign(local, values);
    changeListeners.forEach((listener) =>
      listener(
        Object.fromEntries(
          Object.keys(values).map((key) => [
            key,
            { newValue: values[key] }
          ])
        ),
        "local"
      )
    );
    await flush();
  };
  const request = async (from: {
    origin?: string;
    source?: unknown;
  } = {}) => {
    messageListeners.forEach((listener) =>
      listener({
        origin: from.origin ?? NOWLY,
        source: "source" in from ? from.source : target,
        data: {
          source: "Nowly",
          type: "GET_SEASON"
        }
      })
    );
    await flush();
  };
  return { posted, change, request };
};

const seasonOf = (posted: Posted) =>
  (
    posted.message as {
      payload: {
        season: unknown;
      };
    }
  ).payload.season;

describe("startWebSeason", () => {
  it("sends the season on detection, to the page origin only", async () => {
    const { posted } = setup();
    await flush();
    expect(posted).toEqual([
      {
        message: {
          source: "Nowly",
          type: "SEASON",
          payload: { season: "halloween" }
        },
        targetOrigin: NOWLY
      }
    ]);
  });

  it.each([
    {
      name: "an explicit opt-out overrides a season override",
      local: {
        settings: { seasonalThemes: false },
        seasonOverride: "winter"
      },
      season: null
    },
    {
      name: "an explicit opt-in overrides the migration marker",
      local: {
        settings: {
          seasonalThemes: true,
          seasonalThemeMigrated: true
        }
      },
      season: "halloween"
    },
    {
      name: "legacy Seasonal appearance still enables the theme",
      local: {
        settings: {
          appearance: "seasonal",
          seasonalThemeMigrated: true
        }
      },
      season: "halloween"
    },
    {
      name: "a migrated opt-out stays off",
      local: {
        settings: { seasonalThemeMigrated: true }
      },
      season: null
    },
    {
      name: "a valid override is applied",
      local: { seasonOverride: "winter" },
      season: "winter"
    },
    {
      name: "none suppresses the calendar",
      local: { seasonOverride: "none" },
      season: null
    },
    {
      name: "an invalid stored override falls back to the calendar",
      local: { seasonOverride: "bogus" },
      season: "halloween"
    }
  ])("$name", async ({ local, season }) => {
    const { posted } = setup({ local });
    await flush();
    expect(posted.map(seasonOf)).toEqual([season]);
  });

  it("sends again when the setting or the override changes, and only then", async () => {
    const { posted, change } = setup();
    await flush();
    await change({
      settings: { seasonalThemes: false }
    });
    await change({
      settings: {
        seasonalThemes: false,
        presenceLanguage: "fr-FR"
      }
    });
    await change({
      seasonOverride: "winter",
      settings: { seasonalThemes: true }
    });
    expect(posted.map(seasonOf)).toEqual(["halloween", null, "winter"]);
  });

  it("answers an explicit request from the page", async () => {
    const { posted, request } = setup();
    await flush();
    await request();
    expect(posted.map(seasonOf)).toEqual(["halloween", "halloween"]);
  });

  it("ignores requests from another frame or origin", async () => {
    const { posted, request } = setup();
    await flush();
    await request({ source: null });
    await request({ origin: "https://evil.example" });
    expect(posted).toHaveLength(1);
  });

  it("stays silent outside nowly.me", async () => {
    const { posted, change, request } = setup({ origin: "https://example.com" });
    await flush();
    await change({
      settings: { seasonalThemes: false }
    });
    await request({ origin: "https://example.com" });
    expect(posted).toEqual([]);
  });
});