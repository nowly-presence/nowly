import { buildHandlerRegistry } from "@/background/router/handlers";
import { registerRouter } from "@/background/router/router";
import { registerPresenceRuntimeBridge } from "@/background/runtime/presence-runtime-bridge";
import { registerAccountSyncListeners } from "@/background/services/account-sync";
import { registerAlarmHandlers } from "@/background/services/alarms";
import { registerCreatorDraftSync } from "@/background/services/creator-drafts-sync";
import { registerCommandHandlers } from "@/background/services/commands";
import { registerCustomActivityEditors } from "@/background/services/custom-activity-editors";
import { initializeBackground, registerLifecycleHandlers } from "@/background/services/lifecycle";

registerCustomActivityEditors();
registerRouter(buildHandlerRegistry());
registerPresenceRuntimeBridge();
registerLifecycleHandlers();
registerAlarmHandlers();
registerAccountSyncListeners();
registerCreatorDraftSync();
registerCommandHandlers();
initializeBackground();