"use server"

import { generateText } from "ai"
import { openaiClient, validateAIConfig, defaultGenerationConfig } from "@/lib/ai-config"
import { generateTextWithClaude, isAnthropicAvailable } from "./anthropic-service"
import { generateTextWithGemini, isGeminiAvailable } from "./gemini-service"
import { generateTextWithCohere, isCohereAvailable, generateChatWithCohere } from "./cohere-service"
import { AI_CONFIG, type AIProvider, getPreferredProvider } from "@/lib/ai-config"

export class UnifiedAIService {
  private static instance: UnifiedAIService

  private constructor() {
    try {
      validateAIConfig()
    } catch (error) {
      console.error("❌ Error en configuración de IA:", error)
      throw error
    }
  }

  static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService()
    }
    return UnifiedAIService.instance
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      console.log("🤖 Generando texto con IA...")
      console.log("📝 Prompt:", prompt.substring(0, 100) + "...")

      const { text } = await generateText({
        model: openaiClient("gpt-4o-mini"),
        system: systemPrompt || "Eres un asistente experto en diseño instruccional y creación de cursos educativos.",
        prompt,
        ...defaultGenerationConfig,
      })

      console.log("✅ Texto generado exitosamente")
      console.log("📄 Respuesta:", text.substring(0, 200) + "...")

      return text
    } catch (error: any) {
      console.error("❌ Error al generar texto:", error)

      // Manejo específico de errores de OpenAI
      if (error?.message?.includes("API key")) {
        throw new Error("Clave de API de OpenAI inválida o no configurada")
      }

      if (error?.message?.includes("quota")) {
        throw new Error("Cuota de API de OpenAI agotada")
      }

      if (error?.message?.includes("rate limit")) {
        throw new Error("Límite de velocidad de API excedido")
      }

      throw new Error(`Error del servicio de IA: ${error?.message || "Error desconocido"}`)
    }
  }

  async generateCourseStructure(courseData: any): Promise<any[]> {
    const prompt = `
Basándote en la siguiente información del curso, genera una estructura de módulos en formato JSON:

Título: ${courseData.title}
Audiencia: ${courseData.audience}
Problema que resuelve: ${courseData.problem}
Propósito: ${courseData.purpose}
Modalidad: ${courseData.modality}
Duración: ${courseData.duration}
Nivel: ${courseData.experience}

Genera entre 4-8 módulos que cubran el contenido de manera lógica y progresiva.

Responde ÚNICAMENTE con un array JSON válido con esta estructura:
[
  {
    "id": "modulo-1",
    "title": "Título del módulo",
    "description": "Descripción detallada del módulo",
    "duration": "2 horas",
    "objectives": ["Objetivo 1", "Objetivo 2"],
    "topics": ["Tema 1", "Tema 2", "Tema 3"]
  }
]
`

    try {
      const response = await this.generateText(prompt)

      // Limpiar la respuesta para extraer solo el JSON
      let cleanResponse = response.trim()

      // Buscar el inicio del array JSON
      const jsonStart = cleanResponse.indexOf("[")
      const jsonEnd = cleanResponse.lastIndexOf("]") + 1

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd)
      }

      console.log("🔍 Respuesta limpia:", cleanResponse)

      const modules = JSON.parse(cleanResponse)

      // Validar estructura
      if (!Array.isArray(modules)) {
        throw new Error("La respuesta no es un array válido")
      }

      // Validar cada módulo
      const validatedModules = modules.map((module, index) => ({
        id: module.id || `modulo-${index + 1}`,
        title: module.title || `Módulo ${index + 1}`,
        description: module.description || "Descripción del módulo",
        duration: module.duration || "2 horas",
        objectives: Array.isArray(module.objectives) ? module.objectives : ["Objetivo principal"],
        topics: Array.isArray(module.topics) ? module.topics : ["Tema principal"],
      }))

      console.log("✅ Módulos validados:", validatedModules.length)
      return validatedModules
    } catch (error: any) {
      console.error("❌ Error al generar estructura:", error)

      // Estructura fallback
      return [
        {
          id: "modulo-1",
          title: "Introducción y Fundamentos",
          description: "Módulo introductorio que establece las bases del curso",
          duration: "2 horas",
          objectives: ["Comprender los conceptos básicos", "Establecer objetivos de aprendizaje"],
          topics: ["Conceptos fundamentales", "Objetivos del curso", "Metodología"],
        },
        {
          id: "modulo-2",
          title: "Desarrollo Teórico",
          description: "Desarrollo de los conceptos teóricos principales",
          duration: "3 horas",
          objectives: ["Dominar la teoría", "Aplicar conceptos"],
          topics: ["Marco teórico", "Principios clave", "Casos de estudio"],
        },
        {
          id: "modulo-3",
          title: "Aplicación Práctica",
          description: "Aplicación práctica de los conocimientos adquiridos",
          duration: "3 horas",
          objectives: ["Implementar soluciones", "Resolver problemas"],
          topics: ["Ejercicios prácticos", "Proyectos", "Resolución de problemas"],
        },
        {
          id: "modulo-4",
          title: "Evaluación y Cierre",
          description: "Evaluación final y consolidación del aprendizaje",
          duration: "2 horas",
          objectives: ["Evaluar el aprendizaje", "Consolidar conocimientos"],
          topics: ["Evaluación final", "Retroalimentación", "Próximos pasos"],
        },
      ]
    }
  }
}

export const aiService = UnifiedAIService.getInstance()

// Función para generar texto con OpenAI usando AI SDK
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
    console.log("🔍 DIAGNÓSTICO - Iniciando generateTextWithOpenAI...")

    if (!process.env.WHORKSHOP_OPENAI_API_KEY) {
      console.error("🔍 DIAGNÓSTICO - WHORKSHOP_OPENAI_API_KEY no está configurada")
      throw new Error("WHORKSHOP_OPENAI_API_KEY no está configurada")
    }

    console.log("🔍 DIAGNÓSTICO - Enviando request a OpenAI...")
    const { text } = await generateText({
      model: openaiClient(options?.model || AI_CONFIG.openai.model),
      system: systemPrompt,
      prompt,
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 2000,
    })

    if (!text) {
      console.error("🔍 DIAGNÓSTICO - No se recibió contenido de OpenAI")
      throw new Error("No se recibió contenido de OpenAI")
    }

    console.log("🔍 DIAGNÓSTICO - Respuesta exitosa de OpenAI, longitud:", text.length)
    return text
  } catch (error: any) {
    console.error("🔍 DIAGNÓSTICO - Error al generar texto con OpenAI:", error)

    // Proporcionar más detalles sobre el error
    if (error.message?.includes("API key")) {
      throw new Error(`Error de OpenAI: API key inválida. Verifica WHORKSHOP_OPENAI_API_KEY`)
    } else if (error.message?.includes("quota")) {
      throw new Error(`Error de OpenAI: Cuota insuficiente. Verifica el saldo de la cuenta`)
    } else {
      throw new Error(`Error de OpenAI: ${error.message || "Error desconocido"}`)
    }
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
      console.log(`🔍 DIAGNÓSTICO - Intentando generar texto con ${provider}...`)

      let text: string

      switch (provider) {
        case "openai":
          if (!AI_CONFIG.openai.apiKey) {
            console.log("🔍 DIAGNÓSTICO - WHORKSHOP_OPENAI_API_KEY no disponible, saltando OpenAI")
            continue
          }
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

      console.log(`🔍 DIAGNÓSTICO - Texto generado exitosamente con ${provider}`)
      return {
        text,
        provider,
        success: true,
      }
    } catch (error: any) {
      console.error(`🔍 DIAGNÓSTICO - Error con ${provider}:`, error.message)
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
      keyName: "WHORKSHOP_OPENAI_API_KEY",
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
