import type { RegisteredUserScript, ChromeWithUserScripts } from "@/background/runtime/user-scripts";

export interface PresenceInjector {
  register(script: RegisteredUserScript): Promise<void>;
  unregister(id: string): Promise<void>;
  getRegistered(ids: string[]): Promise<RegisteredUserScript[]>;
}

// --- userScripts implementation (Chrome + Firefox 136+) ---
// Both browsers expose the MV3 userScripts API on `chrome.userScripts` and compile the
// inline `code` natively in a CSP-exempt USER_SCRIPT world, so no eval/new Function is
// needed on our side. The API namespace is undefined until enabled - Chrome's "Allow user
// scripts" toggle, Firefox's optional `userScripts` permission grant - and we no-op until then
// (the onboarding gate prompts the user). The same registration persists and auto-injects on
// future navigations in both browsers.

class UserScriptsPresenceInjector implements PresenceInjector {
  private get api() {
    return (chrome as ChromeWithUserScripts).userScripts;
  }

  async register(script: RegisteredUserScript): Promise<void> {
    const api = this.api;
    if (!api) return;
    try {
      await api.register([script]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes("duplicate")) throw error;
      await api.unregister({ ids: [script.id] });
      await api.register([script]);
    }
  }

  async unregister(id: string): Promise<void> {
    const api = this.api;
    if (!api) return;
    const scripts = await api.getScripts({ ids: [id] });
    if (!scripts.length) return;
    await api.unregister({ ids: [id] });
  }

  async getRegistered(ids: string[]): Promise<RegisteredUserScript[]> {
    const api = this.api;
    if (!api) return [];
    return (await api.getScripts({ ids })) as RegisteredUserScript[];
  }
}

export const presenceInjector: PresenceInjector = new UserScriptsPresenceInjector();
