import { generateTextWithAI } from "@/services/unified-ai-service"
import type { CourseModule } from "@/types/course"

// Función específica para generar estructura de curso
export async function generateCourseStructureWithAI(courseData: any): Promise<CourseModule[]> {
  const systemPrompt = `Eres un diseñador instruccional experto. Tu tarea es crear una estructura de módulos para un curso educativo.

INSTRUCCIONES CRÍTICAS:
1. Debes devolver ÚNICAMENTE un array JSON válido.
2. NO incluyas texto adicional, explicaciones o formato markdown.
3. El JSON debe ser parseable directamente.
4. Cada módulo debe tener: id, title, description, duration, objectives, topics.`

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
      fallbackProviders: ["cohere", "anthropic", "google"],
      maxTokens: 2000,
      temperature: 0.3,
    })

    // Limpiar la respuesta para extraer solo el JSON
    let cleanedResponse = result.text.trim()

    // Remover posibles bloques de código markdown
    const jsonMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[1].trim()
    }

    // Intentar parsear el JSON
    const modules = JSON.parse(cleanedResponse) as CourseModule[]

    // Validar que sea un array
    if (!Array.isArray(modules)) {
      throw new Error("La respuesta no es un array válido")
    }

    // Validar estructura de cada módulo
    const validatedModules = modules.map((module, index) => ({
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

    // Fallback: crear estructura básica
    return [
      {
        id: "modulo-1",
        title: "Módulo 1: Introducción",
        description: `Introducción a los conceptos fundamentales de ${courseData.title}`,
        duration: "2 horas",
        objectives: ["Comprender los conceptos básicos", "Identificar los objetivos del curso"],
        topics: ["Conceptos fundamentales", "Objetivos de aprendizaje", "Metodología"],
      },
      {
        id: "modulo-2",
        title: "Módulo 2: Fundamentos",
        description: `Desarrollo de los conocimientos básicos sobre ${courseData.title}`,
        duration: "3 horas",
        objectives: ["Dominar los fundamentos teóricos", "Aplicar conceptos básicos"],
        topics: ["Teoría fundamental", "Principios básicos", "Aplicaciones iniciales"],
      },
      {
        id: "modulo-3",
        title: "Módulo 3: Aplicación Práctica",
        description: "Aplicación práctica de los conocimientos adquiridos",
        duration: "4 horas",
        objectives: ["Implementar soluciones prácticas", "Resolver problemas reales"],
        topics: ["Casos de estudio", "Ejercicios prácticos", "Resolución de problemas"],
      },
      {
        id: "modulo-4",
        title: "Módulo 4: Proyecto Final",
        description: "Integración de todos los conocimientos en un proyecto final",
        duration: "3 horas",
        objectives: ["Integrar todos los conocimientos", "Demostrar competencias adquiridas"],
        topics: ["Desarrollo de proyecto", "Presentación", "Evaluación final"],
      },
    ]
  }
}

// Función para generar texto simple
export async function generateSimpleText(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "openai",
      fallbackProviders: ["cohere", "anthropic", "google"],
      maxTokens: 1000,
      temperature: 0.7,
    })

    return result.text
  } catch (error: any) {
    console.error("Error generando texto simple:", error)
    return "Error al generar contenido con IA"
  }
}

// Re-exportar la función principal
export { generateTextWithAI }
