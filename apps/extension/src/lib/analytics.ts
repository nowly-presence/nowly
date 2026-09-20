import { sendMessage } from "@/lib/messages"
import type { TrackInput } from "@nowly/analytics"

export const trackUiEvent = (key: string, input: TrackInput = {}): void => {
  void sendMessage("TRACK_EVENT", { key, ...input })
}
