// Configuración centralizada para todas las APIs de IA
export const AI_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    maxTokens: 2000,
    temperature: 0.7,
  },

  // Anthropic Claude Configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: "claude-3-haiku-20240307", // Modelo más rápido y económico
    maxTokens: 2000,
    temperature: 0.7,
  },

  // Google Gemini Configuration
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-1.5-flash", // Modelo más rápido y económico
    maxTokens: 2000,
    temperature: 0.7,
  },

  // Grok Configuration (ya existente)
  grok: {
    apiKey: process.env.GROK_API_KEY,
    model: "grok-2-latest",
    maxTokens: 200,
    temperature: 0.8,
  },

  // Configuraciones generales
  general: {
    timeout: 30000, // 30 segundos
    retries: 2,
    cacheEnabled: true,
    cacheTTL: 1800000, // 30 minutos
  },
} as const

// Función para validar que todas las API keys estén configuradas
export function validateApiKeys() {
  const missingKeys: string[] = []

  if (!AI_CONFIG.openai.apiKey) {
    missingKeys.push("OPENAI_API_KEY")
  }

  if (!AI_CONFIG.anthropic.apiKey) {
    missingKeys.push("ANTHROPIC_API_KEY")
  }

  if (!AI_CONFIG.google.apiKey) {
    missingKeys.push("GOOGLE_API_KEY")
  }

  if (!AI_CONFIG.grok.apiKey) {
    missingKeys.push("GROK_API_KEY")
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
    availableProviders: {
      openai: !!AI_CONFIG.openai.apiKey,
      anthropic: !!AI_CONFIG.anthropic.apiKey,
      google: !!AI_CONFIG.google.apiKey,
      grok: !!AI_CONFIG.grok.apiKey,
    },
  }
}

// Tipos para los proveedores de IA
export type AIProvider = "openai" | "anthropic" | "google" | "grok"

// Función para obtener el proveedor preferido basado en disponibilidad
export function getPreferredProvider(
  preferredOrder: AIProvider[] = ["openai", "anthropic", "google"],
): AIProvider | null {
  const validation = validateApiKeys()

  for (const provider of preferredOrder) {
    if (validation.availableProviders[provider]) {
      return provider
    }
  }

  return null
}
