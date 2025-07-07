"use server"

import { generateTextWithAI } from "@/services/unified-ai-service"
import type { CourseData, CourseModule } from "@/types/course"

export async function generateCourseStructure(courseData: CourseData): Promise<CourseModule[]> {
  const systemPrompt =
    'Eres un diseñador instruccional experto. Tu tarea es devolver únicamente un array JSON válido con la estructura de módulos para un curso. El objeto raíz debe ser `{"modules": [...]}`. Cada módulo debe tener: id (string), title (string), description (string), duration (string), objectives (array de strings), topics (array de strings).'
  const userPrompt = `Crea una estructura JSON para un curso titulado "${courseData.title}".`

  try {
    const jsonString = await generateTextWithAI(systemPrompt, userPrompt, {
      provider: "openai", // OpenAI es el mejor para JSON estructurado
      fallbacks: ["google"],
      isJsonMode: true,
    })
    const result = JSON.parse(jsonString)
    const modules = result.modules
    if (!Array.isArray(modules)) throw new Error("La IA no devolvió un array de módulos.")
    return modules
  } catch (error) {
    console.error("Error al generar la estructura del curso:", error)
    return [] // Devolver un fallback vacío
  }
}

export async function generateMaterialSuggestions(
  courseData: CourseData,
  context: { theoreticalContext?: string; practicalContext?: string },
): Promise<string> {
  const systemPrompt =
    "Eres un diseñador instruccional creativo. Sugiere una lista concisa de materiales y recursos para un curso, en formato Markdown."
  const userPrompt = `Basado en el curso "${courseData.title}", sugiere una lista de materiales.`

  return generateTextWithAI(systemPrompt, userPrompt, {
    provider: "cohere", // Cohere es bueno para creatividad
    fallbacks: ["openai", "google"],
  })
}

export async function generateEvaluationMethod(courseData: CourseData): Promise<string> {
  const systemPrompt = "Eres un experto en evaluación educativa. Propón un método de evaluación detallado y práctico."
  const userPrompt = `Para el curso "${courseData.title}", describe un método de evaluación efectivo.`

  return generateTextWithAI(systemPrompt, userPrompt, {
    provider: "openai", // OpenAI para una respuesta más estructurada
    fallbacks: ["cohere", "google"],
  })
}

export function validateCourseData(courseData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validaciones básicas
  if (!courseData) {
    errors.push("Los datos del curso son requeridos")
    return { isValid: false, errors }
  }

  if (!courseData.title || typeof courseData.title !== "string" || courseData.title.trim().length === 0) {
    errors.push("El título del curso es requerido")
  }

  if (courseData.title && courseData.title.length < 5) {
    errors.push("El título del curso debe tener al menos 5 caracteres")
  }

  if (courseData.title && courseData.title.length > 200) {
    errors.push("El título del curso no puede exceder 200 caracteres")
  }

  // Validaciones opcionales pero recomendadas
  if (!courseData.audience || courseData.audience.trim().length === 0) {
    errors.push("Se recomienda especificar la audiencia objetivo")
  }

  if (!courseData.purpose || courseData.purpose.trim().length === 0) {
    errors.push("Se recomienda especificar el propósito del curso")
  }

  // Validar estructura si existe
  if (courseData.structure) {
    if (!Array.isArray(courseData.structure)) {
      errors.push("La estructura del curso debe ser un array")
    } else {
      courseData.structure.forEach((module: any, index: number) => {
        if (!module.title || typeof module.title !== "string") {
          errors.push(`El módulo ${index + 1} debe tener un título válido`)
        }
        if (!module.description || typeof module.description !== "string") {
          errors.push(`El módulo ${index + 1} debe tener una descripción válida`)
        }
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export async function generateCourseMaterials(courseData: CourseData): Promise<string | { error: string }> {
  try {
    return await generateMaterialSuggestions(courseData, {
      theoreticalContext: courseData.theoreticalContext,
      practicalContext: courseData.practicalContext,
    })
  } catch (error: any) {
    return { error: error.message || "Error al generar materiales" }
  }
}
