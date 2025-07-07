"use server"

import { generateTextWithAI as unifiedGenerateTextWithAI } from "./unified-ai-service"
import type { AIProvider } from "@/lib/ai-config"

// Re-exportar la función principal del servicio unificado
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
  return unifiedGenerateTextWithAI(prompt, systemPrompt, options)
}

// Función simplificada para casos básicos
export async function generateSimpleText(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const result = await generateTextWithAI(prompt, systemPrompt)
    return result.text
  } catch (error: any) {
    console.error("Error al generar texto:", error)
    throw new Error(`Error al generar texto: ${error.message}`)
  }
}

// Función específica para generar estructura de curso
export async function generateCourseStructureWithAI(courseData: any): Promise<any[]> {
  const prompt = `
Basándote en la siguiente información del curso, genera una estructura de módulos en formato JSON:

Título: ${courseData.title || "Sin título"}
Audiencia: ${courseData.audience || "General"}
Problema que resuelve: ${courseData.problem || "No especificado"}
Propósito: ${courseData.purpose || "No especificado"}
Modalidad: ${courseData.modality || "Online"}
Duración: ${courseData.duration || "No especificada"}
Nivel: ${courseData.experience || "Principiante"}

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

  const systemPrompt = `Eres un experto en diseño instruccional. Tu tarea es crear estructuras de cursos educativos bien organizadas y pedagógicamente sólidas. Siempre responde con JSON válido.`

  try {
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "openai",
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Limpiar la respuesta para extraer solo el JSON
    let cleanResponse = result.text.trim()

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
