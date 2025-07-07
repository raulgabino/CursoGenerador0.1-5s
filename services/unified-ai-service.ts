import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { AI_CONFIG, validateAIConfig } from "@/lib/ai-config"
import type { CourseModule } from "@/types/course"

export interface AIProvider {
  name: string
  available: boolean
  error?: string
}

export interface GenerateTextOptions {
  provider?: "openai" | "anthropic" | "google" | "cohere"
  fallbackProviders?: ("openai" | "anthropic" | "google" | "cohere")[]
  maxTokens?: number
  temperature?: number
}

export interface GenerateTextResult {
  text: string
  provider: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
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
    throw new Error("OpenAI client not available - API key missing")
  }
  return openaiClient
}

// Cliente Google
let googleClient: GoogleGenerativeAI | null = null
function getGoogleClient(): GoogleGenerativeAI {
  if (!googleClient && AI_CONFIG.google.apiKey) {
    googleClient = new GoogleGenerativeAI(AI_CONFIG.google.apiKey)
  }
  if (!googleClient) {
    throw new Error("Google AI client not available - API key missing")
  }
  return googleClient
}

export async function generateTextWithAI(
  prompt: string,
  systemPrompt?: string,
  options: GenerateTextOptions = {},
): Promise<GenerateTextResult> {
  const {
    provider = "openai",
    fallbackProviders = ["anthropic", "google", "cohere"],
    maxTokens = 1000,
    temperature = 0.7,
  } = options

  const providersToTry = [provider, ...fallbackProviders]

  for (const currentProvider of providersToTry) {
    try {
      console.log(`🤖 Intentando generar texto con ${currentProvider}...`)

      switch (currentProvider) {
        case "openai":
          if (!AI_CONFIG.openai.apiKey) {
            console.log("⚠️ OpenAI API key no disponible, saltando...")
            continue
          }

          const openai = getOpenAIClient()
          const messages: any[] = []

          if (systemPrompt) {
            messages.push({ role: "system", content: systemPrompt })
          }
          messages.push({ role: "user", content: prompt })

          const openaiResponse = await openai.chat.completions.create({
            model: AI_CONFIG.openai.models.gpt4mini,
            messages,
            max_tokens: maxTokens,
            temperature,
          })

          const text = openaiResponse.choices[0]?.message?.content || ""
          console.log(`✅ Texto generado exitosamente con OpenAI (${text.length} caracteres)`)

          return {
            text,
            provider: "openai",
            usage: {
              promptTokens: openaiResponse.usage?.prompt_tokens || 0,
              completionTokens: openaiResponse.usage?.completion_tokens || 0,
              totalTokens: openaiResponse.usage?.total_tokens || 0,
            },
          }

        case "google":
          if (!AI_CONFIG.google.apiKey) {
            console.log("⚠️ Google API key no disponible, saltando...")
            continue
          }

          const google = getGoogleClient()
          const model = google.getGenerativeModel({ model: AI_CONFIG.google.models.gemini })

          const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
          const googleResponse = await model.generateContent(fullPrompt)
          const googleText = googleResponse.response.text()

          console.log(`✅ Texto generado exitosamente con Google (${googleText.length} caracteres)`)

          return {
            text: googleText,
            provider: "google",
          }

        case "anthropic":
          console.log("⚠️ Anthropic no implementado aún, saltando...")
          continue

        case "cohere":
          console.log("⚠️ Cohere no implementado aún, saltando...")
          continue

        default:
          console.log(`⚠️ Proveedor desconocido: ${currentProvider}`)
          continue
      }
    } catch (error: any) {
      console.error(`❌ Error con ${currentProvider}:`, error.message)

      // Si es el último proveedor, lanzar el error
      if (currentProvider === providersToTry[providersToTry.length - 1]) {
        throw new Error(`Todos los proveedores de IA fallaron. Último error: ${error.message}`)
      }

      // Continuar con el siguiente proveedor
      continue
    }
  }

  throw new Error("No hay proveedores de IA disponibles")
}

export async function getAIProvidersStatus(): Promise<AIProvider[]> {
  const config = validateAIConfig()

  return [
    {
      name: "OpenAI",
      available: !!AI_CONFIG.openai.apiKey,
      error: !AI_CONFIG.openai.apiKey ? "API key missing" : undefined,
    },
    {
      name: "Anthropic",
      available: !!AI_CONFIG.anthropic.apiKey,
      error: !AI_CONFIG.anthropic.apiKey ? "API key missing" : undefined,
    },
    {
      name: "Google",
      available: !!AI_CONFIG.google.apiKey,
      error: !AI_CONFIG.google.apiKey ? "API key missing" : undefined,
    },
    {
      name: "Cohere",
      available: !!AI_CONFIG.cohere.apiKey,
      error: !AI_CONFIG.cohere.apiKey ? "API key missing" : undefined,
    },
  ]
}

// Función específica para generar estructura de curso
export async function generateCourseStructureWithAI(courseData: any): Promise<CourseModule[]> {
  const systemPrompt = `Eres un diseñador instruccional experto. Tu tarea es crear una estructura de módulos para un curso educativo.

INSTRUCCIONES CRÍTICAS:
1. Debes devolver ÚNICAMENTE un array JSON válido.
2. NO incluyas texto adicional, explicaciones o formato markdown.
3. El JSON debe ser parseable directamente.
4. Cada módulo debe tener exactamente las propiedades: id, title, description, duration, objectives, topics.`

  const prompt = `
Crea una estructura de 4-6 módulos para un curso titulado "${courseData.title}".

Información del curso:
- Audiencia: ${courseData.audience}
- Problema que resuelve: ${courseData.problem}
- Propósito: ${courseData.purpose}
- Modalidad: ${courseData.modality || "No especificada"}
- Duración: ${courseData.duration || "No especificada"}

Devuelve ÚNICAMENTE un array JSON con este formato exacto:
[
  {
    "id": "modulo-1",
    "title": "Título del módulo 1",
    "description": "Descripción detallada del módulo 1",
    "duration": "2 horas",
    "objectives": ["Objetivo 1", "Objetivo 2"],
    "topics": ["Tema 1", "Tema 2", "Tema 3"]
  }
]

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`

  try {
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "openai",
      fallbackProviders: ["google"],
      maxTokens: 2000,
      temperature: 0.3,
    })

    // Limpiar la respuesta
    let cleanedResponse = result.text.trim()

    // Remover bloques de código markdown si existen
    const jsonMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[1].trim()
    }

    // Parsear JSON
    const modules = JSON.parse(cleanedResponse)

    // Validar estructura
    if (!Array.isArray(modules)) {
      throw new Error("La respuesta no es un array válido")
    }

    // Validar cada módulo y asegurar estructura correcta
    const validatedModules: CourseModule[] = modules.map((module, index) => ({
      id: module.id || `modulo-${index + 1}`,
      title: module.title || `Módulo ${index + 1}`,
      description: module.description || "Descripción del módulo",
      duration: module.duration || "2 horas",
      objectives: Array.isArray(module.objectives) ? module.objectives : ["Objetivo principal"],
      topics: Array.isArray(module.topics) ? module.topics : ["Tema principal"],
    }))

    return validatedModules
  } catch (error: any) {
    console.error("Error parseando respuesta de IA:", error)

    // Fallback: estructura básica
    return [
      {
        id: "modulo-1",
        title: "Introducción",
        description: `Introducción a los conceptos fundamentales de ${courseData.title}`,
        duration: "2 horas",
        objectives: ["Comprender los objetivos del curso", "Conocer los conceptos básicos"],
        topics: ["Presentación del curso", "Conceptos fundamentales", "Metodología"],
      },
      {
        id: "modulo-2",
        title: "Fundamentos",
        description: `Desarrollo de conocimientos básicos sobre ${courseData.title}`,
        duration: "3 horas",
        objectives: ["Dominar los principios básicos", "Aplicar conceptos fundamentales"],
        topics: ["Principios teóricos", "Metodologías", "Casos de estudio"],
      },
      {
        id: "modulo-3",
        title: "Aplicación Práctica",
        description: `Aplicación práctica de los conocimientos adquiridos`,
        duration: "4 horas",
        objectives: ["Implementar soluciones prácticas", "Resolver problemas reales"],
        topics: ["Ejercicios prácticos", "Proyectos", "Evaluación"],
      },
    ]
  }
}
