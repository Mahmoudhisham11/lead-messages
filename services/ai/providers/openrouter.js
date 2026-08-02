import { BaseAIProvider } from "./base";

/**
 * OpenRouter AI Provider — Skeleton only.
 * No actual API calls. Will be implemented when OpenRouter integration is added.
 */
export class OpenRouterProvider extends BaseAIProvider {
  constructor() {
    super("openrouter");
    this.apiKey = null;
  }

  isConfigured() {
    return false; // Will check for API key when implemented
  }

  async generate(request) {
    throw new Error(
      "OpenRouter not configured. Add your API key in Settings → AI."
    );
  }
}

export const openRouterProvider = new OpenRouterProvider();
