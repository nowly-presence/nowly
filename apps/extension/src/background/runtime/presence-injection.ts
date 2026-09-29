import type { RegisteredUserScript, ChromeWithUserScripts } from "@/background/runtime/user-scripts"

export interface PresenceInjector {
  register(script: RegisteredUserScript): Promise<void>
  unregister(id: string): Promise<void>
  getRegistered(ids: string[]): Promise<RegisteredUserScript[]>
}

class UserScriptsPresenceInjector implements PresenceInjector {
  private get api() {
    return (chrome as ChromeWithUserScripts).userScripts
  }

  async register(script: RegisteredUserScript): Promise<void> {
    const api = this.api
    if (!api) return
    try {
      await api.register([script])
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.toLowerCase().includes("duplicate")) throw error
      await api.unregister({ ids: [script.id] })
      await api.register([script])
    }
  }

  async unregister(id: string): Promise<void> {
    const api = this.api
    if (!api) return
    const scripts = await api.getScripts({ ids: [id] })
    if (!scripts.length) return
    await api.unregister({ ids: [id] })
  }

  async getRegistered(ids: string[]): Promise<RegisteredUserScript[]> {
    const api = this.api
    if (!api) return []
    return (await api.getScripts({ ids })) as RegisteredUserScript[]
  }
}

export const presenceInjector: PresenceInjector = new UserScriptsPresenceInjector()
