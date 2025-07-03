"use server"

import { generateTextWithClaude, isAnthropicAvailable } from "./anthropic-service"
import { generateTextWithGemini, isGeminiAvailable } from "./gemini-service"
import { generateTextWithCohere, isCohereAvailable, generateChatWithCohere } from "./cohere-service"
import { AI_CONFIG, type AIProvider, getPreferredProvider } from "@/lib/ai-config"
import OpenAI from "openai"

// Cliente OpenAI (ya existente, pero lo centralizamos aquí)
let openaiClient: OpenAI | null = null

async function getOpenAIClient(): Promise<OpenAI> {
  if (!openaiClient) {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error("OPENAI_API_KEY no está configurada")
    }

    openaiClient = new OpenAI({
      apiKey: AI_CONFIG.openai.apiKey,
    })
  }

  return openaiClient
}

// Función para generar texto con OpenAI
async function generateTextWithOpenAI(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<string> {
  try {
    const client = await getOpenAIClient()

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      })
    }

    messages.push({
      role: "user",
      content: prompt,
    })

    const response = await client.chat.completions.create({
      model: options?.model || AI_CONFIG.openai.model,
      messages,
      max_tokens: options?.maxTokens || AI_CONFIG.openai.maxTokens,
      temperature: options?.temperature || AI_CONFIG.openai.temperature,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error("No se recibió contenido de OpenAI")
    }

    return content
  } catch (error: any) {
    console.error("Error al generar texto con OpenAI:", error)
    throw new Error(`Error de OpenAI: ${error.message || "Error desconocido"}`)
  }
}

// Función unificada para generar texto con cualquier proveedor
export async function generateTextWithAI(
  prompt: string,
  systemPrompt?: string,
  options?: {
    provider?: AIProvider
    model?: string
    maxTokens?: number
    temperature?: number
    fallbackProviders?: AIProvider[]
  },
): Promise<{
  text: string
  provider: AIProvider
  success: boolean
}> {
  const preferredProvider = options?.provider || (await getPreferredProvider())
  const fallbackProviders = options?.fallbackProviders || ["openai", "cohere", "anthropic", "google"]

  // Lista de proveedores a intentar
  const providersToTry: AIProvider[] = []

  if (preferredProvider) {
    providersToTry.push(preferredProvider)
  }

  // Añadir fallbacks que no estén ya en la lista
  for (const provider of fallbackProviders) {
    if (!providersToTry.includes(provider)) {
      providersToTry.push(provider)
    }
  }

  let lastError: Error | null = null

  for (const provider of providersToTry) {
    try {
      console.log(`Intentando generar texto con ${provider}...`)

      let text: string

      switch (provider) {
        case "openai":
          if (!AI_CONFIG.openai.apiKey) continue
          text = await generateTextWithOpenAI(prompt, systemPrompt, options)
          break

        case "cohere":
          if (!(await isCohereAvailable())) continue
          // Usar chat si hay system prompt, generate si no
          if (systemPrompt) {
            text = await generateChatWithCohere(
              [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
              options,
            )
          } else {
            text = await generateTextWithCohere(prompt, systemPrompt, options)
          }
          break

        case "anthropic":
          if (!(await isAnthropicAvailable())) continue
          text = await generateTextWithClaude(prompt, systemPrompt, options)
          break

        case "google":
          if (!(await isGeminiAvailable())) continue
          text = await generateTextWithGemini(prompt, systemPrompt, options)
          break

        default:
          continue
      }

      console.log(`Texto generado exitosamente con ${provider}`)
      return {
        text,
        provider,
        success: true,
      }
    } catch (error: any) {
      console.error(`Error con ${provider}:`, error.message)
      lastError = error
      continue
    }
  }

  // Si llegamos aquí, todos los proveedores fallaron
  throw new Error(`Todos los proveedores de IA fallaron. Último error: ${lastError?.message || "Error desconocido"}`)
}

// Función para obtener el estado de todos los proveedores
export async function getAIProvidersStatus() {
  return {
    openai: {
      available: !!AI_CONFIG.openai.apiKey,
      model: AI_CONFIG.openai.model,
    },
    cohere: {
      available: await isCohereAvailable(),
      model: AI_CONFIG.cohere.model,
    },
    anthropic: {
      available: await isAnthropicAvailable(),
      model: AI_CONFIG.anthropic.model,
    },
    google: {
      available: await isGeminiAvailable(),
      model: AI_CONFIG.google.model,
    },
    grok: {
      available: !!AI_CONFIG.grok.apiKey,
      model: AI_CONFIG.grok.model,
    },
  }
}

// Función para generar texto con múltiples proveedores en paralelo (para comparación)
export async function generateTextWithMultipleProviders(
  prompt: string,
  systemPrompt?: string,
  providers: AIProvider[] = ["openai", "cohere", "anthropic"],
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<
  Array<{
    provider: AIProvider
    text: string | null
    error: string | null
    duration: number
  }>
> {
  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      const startTime = Date.now()
      try {
        const result = await generateTextWithAI(prompt, systemPrompt, {
          ...options,
          provider,
          fallbackProviders: [], // No usar fallbacks en comparación
        })
        return {
          provider,
          text: result.text,
          error: null,
          duration: Date.now() - startTime,
        }
      } catch (error: any) {
        return {
          provider,
          text: null,
          error: error.message,
          duration: Date.now() - startTime,
        }
      }
    }),
  )

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value
    } else {
      return {
        provider: providers[index],
        text: null,
        error: result.reason?.message || "Error desconocido",
        duration: 0,
      }
    }
  })
}
