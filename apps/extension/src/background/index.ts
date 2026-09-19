import { buildHandlerRegistry } from "@/background/router/handlers"
import { registerHandlers, registerRouter } from "@/background/router/router"
import { registerPresenceRuntimeBridge } from "@/background/runtime/presence-runtime-bridge"
import { registerAlarmHandlers } from "@/background/services/alarms"
import { registerCommandHandlers } from "@/background/services/commands"
import { initializeBackground, registerLifecycleHandlers } from "@/background/services/lifecycle"

registerHandlers(buildHandlerRegistry())
registerRouter()
registerPresenceRuntimeBridge()
registerLifecycleHandlers()
registerAlarmHandlers()
registerCommandHandlers()
initializeBackground()
