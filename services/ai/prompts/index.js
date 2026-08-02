import { AI_TYPES, AI_TONES, AI_LANGUAGES } from "../index";

/**
 * Prompt templates for AI features.
 * These are the prompt structures — actual generation happens via the AI provider.
 */

export const PROMPTS = {
  [AI_TYPES.GENERATE]: {
    system: "You are a real estate WhatsApp message writer for the Egyptian market.",
    buildPrompt: ({ leadName, propertyType, budget, tone, language }) =>
      `Write a WhatsApp message for a potential client named ${leadName}.` +
      (propertyType ? ` They are interested in ${propertyType}.` : "") +
      (budget ? ` Budget: ${budget} EGP.` : "") +
      ` Tone: ${tone}. Language: ${language}. Keep it under 300 characters.`,
  },

  [AI_TYPES.REWRITE]: {
    system: "You are a real estate message editor. Rewrite messages to be more effective.",
    buildPrompt: ({ originalMessage, tone, language }) =>
      `Rewrite this WhatsApp message to be more ${tone}: "${originalMessage}"` +
      ` Language: ${language}. Keep it under 300 characters.`,
  },

  [AI_TYPES.IMPROVE_TONE]: {
    system: "You are a tone improvement specialist for business communications.",
    buildPrompt: ({ message, targetTone }) =>
      `Improve the tone of this message to be more ${targetTone}: "${message}"` +
      ` Keep the meaning intact. Under 300 characters.`,
  },

  [AI_TYPES.TRANSLATE]: {
    system: "You are a real estate translator specializing in Egyptian property market terminology.",
    buildPrompt: ({ message, targetLanguage }) =>
      `Translate this real estate message to ${targetLanguage}: "${message}"` +
      ` Keep it natural and under 300 characters.`,
  },
};
