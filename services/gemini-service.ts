"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { AI_CONFIG } from "@/lib/ai-config"

// Inicializar cliente de Google Gemini
let geminiClient: GoogleGenerativeAI | null = null

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!AI_CONFIG.google.apiKey) {
      throw new Error("GOOGLE_API_KEY no está configurada")
    }

    geminiClient = new GoogleGenerativeAI(AI_CONFIG.google.apiKey)
  }

  return geminiClient
}

// Función base para generar texto con Gemini
export async function generateTextWithGemini(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<string> {
  try {
    const client = getGeminiClient()
    const model = client.getGenerativeModel({
      model: options?.model || AI_CONFIG.google.model,
      generationConfig: {
        maxOutputTokens: options?.maxTokens || AI_CONFIG.google.maxTokens,
        temperature: options?.temperature || AI_CONFIG.google.temperature,
      },
    })

    // Combinar system prompt con el prompt del usuario si existe
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUsuario: ${prompt}` : prompt

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    if (!text) {
      throw new Error("No se recibió contenido de texto de Gemini")
    }

    return text
  } catch (error: any) {
    console.error("Error al generar texto con Gemini:", error)
    throw new Error(`Error de Gemini: ${error.message || "Error desconocido"}`)
  }
}

// Función para verificar si Gemini está disponible
export function isGeminiAvailable(): boolean {
  return !!AI_CONFIG.google.apiKey
}
