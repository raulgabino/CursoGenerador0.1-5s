export const AI_CONFIG = {
  openai: {
    apiKey: process.env.WHORKSHOP_OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    models: {
      gpt4: "gpt-4o",
      gpt35: "gpt-3.5-turbo",
      gpt4mini: "gpt-4o-mini",
    },
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: "https://api.anthropic.com",
    models: {
      claude3: "claude-3-sonnet-20240229",
      claude35: "claude-3-5-sonnet-20241022",
    },
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    models: {
      gemini: "gemini-1.5-pro",
    },
  },
  cohere: {
    apiKey: process.env.COHERE_API_KEY,
    models: {
      command: "command-r-plus",
    },
  },
}

export function validateAIConfig() {
  const providers = []

  if (AI_CONFIG.openai.apiKey) providers.push("openai")
  if (AI_CONFIG.anthropic.apiKey) providers.push("anthropic")
  if (AI_CONFIG.google.apiKey) providers.push("google")
  if (AI_CONFIG.cohere.apiKey) providers.push("cohere")

  return {
    hasValidProviders: providers.length > 0,
    availableProviders: providers,
    missingKeys: [
      !AI_CONFIG.openai.apiKey && "WHORKSHOP_OPENAI_API_KEY",
      !AI_CONFIG.anthropic.apiKey && "ANTHROPIC_API_KEY",
      !AI_CONFIG.google.apiKey && "GOOGLE_API_KEY",
      !AI_CONFIG.cohere.apiKey && "COHERE_API_KEY",
    ].filter(Boolean),
  }
}
