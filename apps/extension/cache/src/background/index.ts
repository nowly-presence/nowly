import { registerCommandHandlers } from "@/background/services/commands";
import { registerAlarmHandlers } from "@/background/services/alarms";
import { initializeBackground, registerLifecycleHandlers } from "@/background/services/lifecycle";
import { registerRuntimeMessageRouter } from "@/background/services/message-router";
import { registerPresenceRuntimeBridge } from "@/background/runtime/presence-runtime-bridge";

registerRuntimeMessageRouter();
registerPresenceRuntimeBridge();
registerLifecycleHandlers();
registerAlarmHandlers();
registerCommandHandlers();
initializeBackground();