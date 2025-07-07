"use server"

import { generateTextWithAI } from "@/services/unified-ai-service"
import type { CourseData, CourseModule } from "@/types/course"

/**
 * Genera la estructura de módulos para un curso.
 * Utiliza OpenAI por su fiabilidad con JSON.
 */
export async function generateCourseStructure(courseData: CourseData): Promise<CourseModule[]> {
  const systemPrompt =
    'Eres un diseñador instruccional experto. Tu tarea es devolver únicamente un array JSON válido con la estructura de módulos para un curso. El objeto raíz debe ser `{"modules": [...]}`. Cada módulo debe tener: id (string), title (string), description (string), duration (string), objectives (array de strings), topics (array de strings).'
  const userPrompt = `Crea una estructura JSON para un curso titulado "${courseData.title}".`

  try {
    const jsonString = await generateTextWithAI(systemPrompt, userPrompt, {
      provider: "openai",
      fallbacks: ["google"],
      isJsonMode: true,
    })
    const result = JSON.parse(jsonString)
    const modules = result.modules
    if (!Array.isArray(modules)) {
      console.error("La respuesta de la IA no es un array válido:", modules)
      return [] // Devolver un array vacío si la estructura no es la esperada
    }
    return modules
  } catch (error) {
    console.error("Error al generar o parsear la estructura del curso:", error)
    return [] // Devolver un array vacío como fallback en caso de error
  }
}

/**
 * Genera sugerencias de materiales para un curso.
 * Utiliza Cohere por su creatividad.
 */
export async function generateMaterialSuggestions(courseData: CourseData): Promise<string> {
  const systemPrompt =
    "Eres un diseñador instruccional creativo. Sugiere una lista concisa de materiales y recursos para un curso, en formato Markdown."
  const userPrompt = `Basado en el curso "${courseData.title}", sugiere una lista de materiales (presentaciones, documentos, videos, herramientas).`

  return generateTextWithAI(systemPrompt, userPrompt, {
    provider: "cohere",
    fallbacks: ["openai", "google"],
  })
}

/**
 * Genera un método de evaluación para un curso.
 * Utiliza OpenAI para obtener una respuesta más estructurada y detallada.
 */
export async function generateEvaluationMethod(courseData: CourseData): Promise<string> {
  const systemPrompt = "Eres un experto en evaluación educativa. Propón un método de evaluación detallado y práctico."
  const userPrompt = `Para el curso "${courseData.title}", describe un método de evaluación efectivo que combine evaluación formativa (para medir el progreso) y sumativa (para medir el resultado final).`

  return generateTextWithAI(systemPrompt, userPrompt, {
    provider: "openai",
    fallbacks: ["cohere", "google"],
  })
}
