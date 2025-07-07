import OpenAI from "openai"
import { Anthropic } from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { CohereApi } from "cohere-ai"
import { AI_CONFIG, isProviderAvailable, getFirstAvailableProvider } from "@/lib/ai-config"

export interface AIResponse {
  text: string
  provider: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface GenerateOptions {
  provider?: "openai" | "anthropic" | "google" | "cohere"
  fallbackProviders?: Array<"openai" | "anthropic" | "google" | "cohere">
  maxTokens?: number
  temperature?: number
}

// Cliente OpenAI
let openaiClient: OpenAI | null = null
function getOpenAIClient(): OpenAI {
  if (!openaiClient && AI_CONFIG.openai.apiKey) {
    openaiClient = new OpenAI({
      apiKey: AI_CONFIG.openai.apiKey,
    })
  }
  if (!openaiClient) {
    throw new Error("OpenAI client not available - API key not configured")
  }
  return openaiClient
}

// Cliente Anthropic
let anthropicClient: Anthropic | null = null
function getAnthropicClient(): Anthropic {
  if (!anthropicClient && AI_CONFIG.anthropic.apiKey) {
    anthropicClient = new Anthropic({
      apiKey: AI_CONFIG.anthropic.apiKey,
    })
  }
  if (!anthropicClient) {
    throw new Error("Anthropic client not available - API key not configured")
  }
  return anthropicClient
}

// Cliente Google
let googleClient: GoogleGenerativeAI | null = null
function getGoogleClient(): GoogleGenerativeAI {
  if (!googleClient && AI_CONFIG.google.apiKey) {
    googleClient = new GoogleGenerativeAI(AI_CONFIG.google.apiKey)
  }
  if (!googleClient) {
    throw new Error("Google client not available - API key not configured")
  }
  return googleClient
}

// Cliente Cohere
let cohereClient: CohereApi | null = null
function getCohereClient(): CohereApi {
  if (!cohereClient && AI_CONFIG.cohere.apiKey) {
    cohereClient = new CohereApi({
      token: AI_CONFIG.cohere.apiKey,
    })
  }
  if (!cohereClient) {
    throw new Error("Cohere client not available - API key not configured")
  }
  return cohereClient
}

// Función para generar texto con OpenAI
async function generateWithOpenAI(
  prompt: string,
  systemPrompt?: string,
  options?: GenerateOptions,
): Promise<AIResponse> {
  const client = getOpenAIClient()

  const messages: Array<{ role: "system" | "user"; content: string }> = []
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt })
  }
  messages.push({ role: "user", content: prompt })

  const response = await client.chat.completions.create({
    model: AI_CONFIG.openai.model,
    messages,
    max_tokens: options?.maxTokens || AI_CONFIG.openai.maxTokens,
    temperature: options?.temperature || AI_CONFIG.openai.temperature,
  })

  return {
    text: response.choices[0]?.message?.content || "",
    provider: "openai",
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
  }
}

// Función para generar texto con Anthropic
async function generateWithAnthropic(
  prompt: string,
  systemPrompt?: string,
  options?: GenerateOptions,
): Promise<AIResponse> {
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: AI_CONFIG.anthropic.model,
    max_tokens: options?.maxTokens || AI_CONFIG.anthropic.maxTokens,
    temperature: options?.temperature || AI_CONFIG.anthropic.temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  })

  const textContent = response.content.find((content) => content.type === "text")

  return {
    text: textContent?.text || "",
    provider: "anthropic",
    usage: response.usage
      ? {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        }
      : undefined,
  }
}

// Función para generar texto con Google
async function generateWithGoogle(
  prompt: string,
  systemPrompt?: string,
  options?: GenerateOptions,
): Promise<AIResponse> {
  const client = getGoogleClient()
  const model = client.getGenerativeModel({ model: AI_CONFIG.google.model })

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
  const response = await model.generateContent(fullPrompt)

  return {
    text: response.response.text() || "",
    provider: "google",
  }
}

// Función para generar texto con Cohere
async function generateWithCohere(
  prompt: string,
  systemPrompt?: string,
  options?: GenerateOptions,
): Promise<AIResponse> {
  const client = getCohereClient()

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
  const response = await client.generate({
    model: AI_CONFIG.cohere.model,
    prompt: fullPrompt,
    maxTokens: options?.maxTokens || AI_CONFIG.cohere.maxTokens,
    temperature: options?.temperature || AI_CONFIG.cohere.temperature,
  })

  return {
    text: response.generations[0]?.text || "",
    provider: "cohere",
  }
}

// Función principal para generar texto con cualquier proveedor
export async function generateTextWithAI(
  prompt: string,
  systemPrompt?: string,
  options?: GenerateOptions,
): Promise<AIResponse> {
  const preferredProvider = options?.provider || getFirstAvailableProvider()
  const fallbackProviders = options?.fallbackProviders || []

  if (!preferredProvider) {
    throw new Error("No AI providers are available - please configure at least one API key")
  }

  const providersToTry = [preferredProvider, ...fallbackProviders].filter(
    (provider, index, arr) => arr.indexOf(provider) === index && isProviderAvailable(provider),
  )

  let lastError: Error | null = null

  for (const provider of providersToTry) {
    try {
      console.log(`🤖 Intentando generar con ${provider}...`)

      switch (provider) {
        case "openai":
          return await generateWithOpenAI(prompt, systemPrompt, options)
        case "anthropic":
          return await generateWithAnthropic(prompt, systemPrompt, options)
        case "google":
          return await generateWithGoogle(prompt, systemPrompt, options)
        case "cohere":
          return await generateWithCohere(prompt, systemPrompt, options)
        default:
          throw new Error(`Proveedor no soportado: ${provider}`)
      }
    } catch (error: any) {
      console.error(`❌ Error con ${provider}:`, error.message)
      lastError = error
      continue
    }
  }

  throw new Error(`Todos los proveedores de IA fallaron. Último error: ${lastError?.message}`)
}

// Función para obtener el estado de los proveedores
export function getAIProvidersStatus() {
  return {
    openai: {
      available: isProviderAvailable("openai"),
      configured: !!AI_CONFIG.openai.apiKey,
    },
    anthropic: {
      available: isProviderAvailable("anthropic"),
      configured: !!AI_CONFIG.anthropic.apiKey,
    },
    google: {
      available: isProviderAvailable("google"),
      configured: !!AI_CONFIG.google.apiKey,
    },
    cohere: {
      available: isProviderAvailable("cohere"),
      configured: !!AI_CONFIG.cohere.apiKey,
    },
  }
}
