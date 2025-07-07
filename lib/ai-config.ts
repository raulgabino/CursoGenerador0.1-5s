// Configuración centralizada para servicios de IA
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.WHORKSHOP_OPENAI_API_KEY,
    model: "gpt-4o-mini",
    maxTokens: 4000,
    temperature: 0.7,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: "claude-3-sonnet-20240229",
    maxTokens: 4000,
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-1.5-flash",
  },
  cohere: {
    apiKey: process.env.COHERE_API_KEY,
    model: "command-r",
  },
}

// Función para validar si un proveedor está disponible
export function isProviderAvailable(provider: keyof typeof AI_CONFIG): boolean {
  return !!AI_CONFIG[provider]?.apiKey
}

export function validateAIConfig() {
  const errors: string[] = []

  if (!AI_CONFIG.openai.apiKey) {
    errors.push("WHORKSHOP_OPENAI_API_KEY no está configurada")
  }

  if (!AI_CONFIG.anthropic.apiKey) {
    errors.push("ANTHROPIC_API_KEY no está configurada")
  }

  if (!AI_CONFIG.google.apiKey) {
    errors.push("GOOGLE_API_KEY no está configurada")
  }

  if (!AI_CONFIG.cohere.apiKey) {
    errors.push("COHERE_API_KEY no está configurada")
  }

  return {
    isValid: errors.length === 0,
    errors,
    availableProviders: {
      openai: isProviderAvailable("openai"),
      anthropic: isProviderAvailable("anthropic"),
      google: isProviderAvailable("google"),
      cohere: isProviderAvailable("cohere"),
    },
  }
}

export function getPreferredProvider() {
  const config = validateAIConfig()

  if (config.availableProviders.openai) return "openai"
  if (config.availableProviders.anthropic) return "anthropic"
  if (config.availableProviders.google) return "google"
  if (config.availableProviders.cohere) return "cohere"

  throw new Error("No hay proveedores de IA disponibles")
}
