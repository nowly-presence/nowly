import { buildHandlerRegistry } from "@/background/router/handlers"
import { registerHandlers, registerRouter } from "@/background/router/router"
import { initializeBackground, registerLifecycleHandlers } from "@/background/services/lifecycle"

registerHandlers(buildHandlerRegistry())
registerRouter()
registerLifecycleHandlers()
initializeBackground()

console.log(`[Nowly] background worker started (${import.meta.env.BROWSER}, ${import.meta.env.VITE_NOWLY_CHANNEL})`)
