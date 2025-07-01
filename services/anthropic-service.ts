"use server"

import Anthropic from "@anthropic-ai/sdk"
import { AI_CONFIG } from "@/lib/ai-config"

// Inicializar cliente de Anthropic
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!AI_CONFIG.anthropic.apiKey) {
      throw new Error("ANTHROPIC_API_KEY no está configurada")
    }

    anthropicClient = new Anthropic({
      apiKey: AI_CONFIG.anthropic.apiKey,
    })
  }

  return anthropicClient
}

// Función base para generar texto con Claude
export async function generateTextWithClaude(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<string> {
  try {
    const client = getAnthropicClient()

    const messages: Anthropic.Messages.MessageParam[] = [
      {
        role: "user",
        content: prompt,
      },
    ]

    const response = await client.messages.create({
      model: options?.model || AI_CONFIG.anthropic.model,
      max_tokens: options?.maxTokens || AI_CONFIG.anthropic.maxTokens,
      temperature: options?.temperature || AI_CONFIG.anthropic.temperature,
      system: systemPrompt,
      messages,
    })

    // Extraer el contenido de texto de la respuesta
    const textContent = response.content
      .filter((content): content is Anthropic.TextBlock => content.type === "text")
      .map((content) => content.text)
      .join("")

    if (!textContent) {
      throw new Error("No se recibió contenido de texto de Claude")
    }

    return textContent
  } catch (error: any) {
    console.error("Error al generar texto con Claude:", error)
    throw new Error(`Error de Claude: ${error.message || "Error desconocido"}`)
  }
}

// Función para verificar si Anthropic está disponible
export function isAnthropicAvailable(): boolean {
  return !!AI_CONFIG.anthropic.apiKey
}
