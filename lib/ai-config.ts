// Configuración centralizada para todos los proveedores de IA
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.WHORKSHOP_OPENAI_API_KEY,
    model: "gpt-4o-mini",
    maxTokens: 2000,
    temperature: 0.7,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: "claude-3-haiku-20240307",
    maxTokens: 2000,
    temperature: 0.7,
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-1.5-flash",
    maxTokens: 2000,
    temperature: 0.7,
  },
  cohere: {
    apiKey: process.env.COHERE_API_KEY,
    model: "command-r-plus",
    maxTokens: 2000,
    temperature: 0.7,
  },
}

// Función para validar si un proveedor está disponible
export function isProviderAvailable(provider: keyof typeof AI_CONFIG): boolean {
  const config = AI_CONFIG[provider]
  return !!config.apiKey
}

// Función para obtener proveedores disponibles
export function getAvailableProviders(): Array<keyof typeof AI_CONFIG> {
  return Object.keys(AI_CONFIG).filter((provider) => isProviderAvailable(provider as keyof typeof AI_CONFIG)) as Array<
    keyof typeof AI_CONFIG
  >
}

// Función para obtener el primer proveedor disponible
export function getFirstAvailableProvider(): keyof typeof AI_CONFIG | null {
  const available = getAvailableProviders()
  return available.length > 0 ? available[0] : null
}
