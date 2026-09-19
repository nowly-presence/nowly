export type DiscordProfileSnapshot = {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
};

export type PresencePayload = {
  name?: string;
  details?: string;
  state?: string;
  startTime?: number;
  endTime?: number;
  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;
  type?: number;
  buttons?: { label: string; url: string }[];
};

export type NativeMessage =
  | { type: "PING" }
  | { type: "SET_ACTIVITY"; presence: PresencePayload }
  | { type: "CLEAR_ACTIVITY" };

export type NativeResponse =
  | {
      type: "PONG";
      connected: boolean;
      status: string;
      version?: string;
      discordConnected?: boolean;
      profile?: DiscordProfileSnapshot | null;
    }
  | { type: "CONNECTED"; version?: string }
  | { type: "OK" }
  | { type: "ERROR"; error: string };
