export type AIType = "generate" | "rewrite" | "improve-tone" | "translate";

export type AITone =
  | "professional"
  | "luxury"
  | "friendly"
  | "investor";

export type AILanguage = "ar" | "en" | "bilingual";

export interface AIContext {
  leadName?: string;
  propertyType?: string;
  budget?: number;
  language?: AILanguage;
}

export interface AIGenerateRequest {
  type: AIType;
  prompt: string;
  context?: AIContext;
  tone?: AITone;
}

export interface AIGenerateResponse {
  content: string;
  provider: string;
  model: string;
  tokens: { input: number; output: number };
}

export type AIErrorCode =
  | "RATE_LIMITED"
  | "INVALID_REQUEST"
  | "PROVIDER_ERROR"
  | "NETWORK_ERROR";

export interface AIError {
  code: AIErrorCode;
  message: string;
  provider?: string;
}
