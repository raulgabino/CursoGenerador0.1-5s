"use server"

import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { CohereClient } from "cohere-ai"
import { AI_CONFIG, isProviderAvailable } from "@/lib/ai-config"

// Inicialización de clientes
const openai = isProviderAvailable("openai") ? new OpenAI({ apiKey: AI_CONFIG.openai.apiKey }) : null
const cohere = isProviderAvailable("cohere") ? new CohereClient({ token: AI_CONFIG.cohere.apiKey }) : null
const google = isProviderAvailable("google") ? new GoogleGenerativeAI(AI_CONFIG.google.apiKey!) : null

type Provider = "openai" | "cohere" | "google"

// Objeto que mapea proveedores a sus funciones de generación
const generators: Record<Provider, Function> = {
  openai: async (systemPrompt: string, userPrompt: string, isJsonMode: boolean) => {
    if (!openai) throw new Error("OpenAI no está configurado")
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.openai.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: isJsonMode ? "json_object" : "text" },
    })
    return response.choices[0]?.message?.content ?? ""
  },
  cohere: async (systemPrompt: string, userPrompt: string) => {
    if (!cohere) throw new Error("Cohere no está configurado")
    const response = await cohere.chat({
      model: AI_CONFIG.cohere.model,
      preamble: systemPrompt,
      message: userPrompt,
    })
    return response.text
  },
  google: async (systemPrompt: string, userPrompt: string) => {
    if (!google) throw new Error("Google no está configurado")
    const model = google.getGenerativeModel({ model: AI_CONFIG.google.model })
    const response = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`)
    return response.response.text()
  },
}

/**
 * Genera texto con un proveedor preferido y fallbacks automáticos.
 */
export async function generateTextWithAI(
  systemPrompt: string,
  userPrompt: string,
  options: { provider: Provider; fallbacks: Provider[]; isJsonMode?: boolean },
): Promise<string> {
  const providersToTry: Provider[] = [options.provider, ...options.fallbacks]

  for (const provider of providersToTry) {
    if (isProviderAvailable(provider)) {
      try {
        console.log(`🤖 Intentando generar con ${provider}...`)
        return await generators[provider](systemPrompt, userPrompt, options.isJsonMode ?? false)
      } catch (error) {
        console.error(`❌ Error con ${provider}:`, error)
        // Continúa al siguiente proveedor si hay un error
      }
    }
  }

  throw new Error("Todos los proveedores de IA fallaron o no están configurados.")
}

export async function getAIProvidersStatus() {
  return {
    providers: {
      openai: {
        available: isProviderAvailable("openai"),
        model: AI_CONFIG.openai.model,
        configured: !!AI_CONFIG.openai.apiKey,
      },
      google: {
        available: isProviderAvailable("google"),
        model: AI_CONFIG.google.model,
        configured: !!AI_CONFIG.google.apiKey,
      },
      cohere: {
        available: isProviderAvailable("cohere"),
        model: AI_CONFIG.cohere.model,
        configured: !!AI_CONFIG.cohere.apiKey,
      },
    },
  }
}
