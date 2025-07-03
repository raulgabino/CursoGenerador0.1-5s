"use server"

import { AI_CONFIG } from "@/lib/ai-config"

// Inicializar cliente de Cohere
let cohereClient: any = null

async function getCohereClient() {
  if (!cohereClient) {
    if (!AI_CONFIG.cohere.apiKey) {
      throw new Error("COHERE_API_KEY no está configurada")
    }

    // Importar dinámicamente el SDK de Cohere
    const { CohereApi } = await import("cohere-ai")

    cohereClient = new CohereApi({
      token: AI_CONFIG.cohere.apiKey,
    })
  }

  return cohereClient
}

// Función base para generar texto con Cohere
export async function generateTextWithCohere(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<string> {
  try {
    const client = await getCohereClient()

    // Combinar system prompt con el prompt del usuario si existe
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUsuario: ${prompt}` : prompt

    const response = await client.generate({
      model: options?.model || AI_CONFIG.cohere.model,
      prompt: fullPrompt,
      maxTokens: options?.maxTokens || AI_CONFIG.cohere.maxTokens,
      temperature: options?.temperature || AI_CONFIG.cohere.temperature,
      k: 0,
      stopSequences: [],
      returnLikelihoods: "NONE",
    })

    const text = response.generations?.[0]?.text

    if (!text) {
      throw new Error("No se recibió contenido de texto de Cohere")
    }

    return text.trim()
  } catch (error: any) {
    console.error("Error al generar texto con Cohere:", error)
    throw new Error(`Error de Cohere: ${error.message || "Error desconocido"}`)
  }
}

// Función para verificar si Cohere está disponible
export async function isCohereAvailable(): Promise<boolean> {
  return !!AI_CONFIG.cohere.apiKey
}

// Función para generar texto con chat de Cohere (más avanzado)
export async function generateChatWithCohere(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<string> {
  try {
    const client = await getCohereClient()

    // Convertir mensajes al formato de Cohere
    const cohereMessages = messages
      .filter((msg) => msg.role !== "system") // Cohere maneja system prompts de forma diferente
      .map((msg) => ({
        role: msg.role === "user" ? "USER" : "CHATBOT",
        message: msg.content,
      }))

    // Extraer system prompt si existe
    const systemMessage = messages.find((msg) => msg.role === "system")
    const preamble = systemMessage?.content

    const response = await client.chat({
      model: options?.model || AI_CONFIG.cohere.model,
      messages: cohereMessages,
      preamble: preamble,
      maxTokens: options?.maxTokens || AI_CONFIG.cohere.maxTokens,
      temperature: options?.temperature || AI_CONFIG.cohere.temperature,
    })

    const text = response.text

    if (!text) {
      throw new Error("No se recibió contenido de texto de Cohere Chat")
    }

    return text.trim()
  } catch (error: any) {
    console.error("Error al generar chat con Cohere:", error)
    throw new Error(`Error de Cohere Chat: ${error.message || "Error desconocido"}`)
  }
}
