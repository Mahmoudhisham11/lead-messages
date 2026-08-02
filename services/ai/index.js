export const AI_TYPES = {
  GENERATE: "generate",
  REWRITE: "rewrite",
  IMPROVE_TONE: "improve-tone",
  TRANSLATE: "translate",
};

export const AI_TONES = {
  PROFESSIONAL: "professional",
  LUXURY: "luxury",
  FRIENDLY: "friendly",
  INVESTOR: "investor",
};

export const AI_LANGUAGES = {
  ARABIC: "ar",
  ENGLISH: "en",
  BILINGUAL: "bilingual",
};

/**
 * AI Service Interface
 * Architecture-only — no actual API calls.
 * When OpenRouter is configured, providers will implement this interface.
 */
export const aiService = {
  isConfigured: () => false,

  generate: async (request) => {
    throw new Error("AI service not configured. Add OpenRouter API key in Settings.");
  },

  getAvailableProviders: () => [],

  getProviderStatus: () => ({
    openrouter: { configured: false, name: "OpenRouter" },
  }),
};
