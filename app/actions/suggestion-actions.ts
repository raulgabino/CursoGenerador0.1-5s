"use server"

import { generateCourseStructureWithAI, generateTextWithAI } from "@/services/generate-text-with-ai"
import type { CourseData, CourseModule } from "@/types/course"

export async function generateCourseStructure(courseData: any): Promise<CourseModule[] | { error: string }> {
  try {
    console.log("🚀 Iniciando generación de estructura de curso...")
    console.log("📋 Datos del curso:", JSON.stringify(courseData, null, 2))

    // Validar que tenemos los datos mínimos necesarios
    if (!courseData) {
      console.error("❌ No se proporcionaron datos del curso")
      return { error: "No se proporcionaron datos del curso" }
    }

    if (!courseData.title || courseData.title.trim() === "") {
      console.error("❌ El título del curso es requerido")
      return { error: "El título del curso es requerido" }
    }

    // Generar estructura con IA
    console.log("🤖 Llamando al servicio de IA...")
    const modules = await generateCourseStructureWithAI(courseData)

    console.log("✅ Estructura generada exitosamente")
    console.log("📊 Número de módulos:", modules.length)
    console.log("📝 Módulos:", modules.map((m) => m.title).join(", "))

    // Validar que la respuesta sea un array
    if (!Array.isArray(modules)) {
      console.error("❌ La respuesta no es un array válido")
      return { error: "Error en el formato de respuesta del servicio de IA" }
    }

    // Validar que tengamos al menos un módulo
    if (modules.length === 0) {
      console.error("❌ No se generaron módulos")
      return { error: "No se pudieron generar módulos para el curso" }
    }

    // Validar estructura de cada módulo
    const validatedModules: CourseModule[] = modules.map((module, index) => {
      const validatedModule: CourseModule = {
        id: typeof module.id === "string" ? module.id : `modulo-${index + 1}`,
        title: typeof module.title === "string" ? module.title : `Módulo ${index + 1}`,
        description: typeof module.description === "string" ? module.description : "Descripción del módulo",
        duration: typeof module.duration === "string" ? module.duration : "2 horas",
        objectives: Array.isArray(module.objectives) ? module.objectives : ["Objetivo principal"],
        topics: Array.isArray(module.topics) ? module.topics : ["Tema principal"],
      }

      console.log(`✅ Módulo ${index + 1} validado:`, validatedModule.title)
      return validatedModule
    })

    console.log("🎉 Estructura de curso generada y validada exitosamente")
    return validatedModules
  } catch (error: any) {
    console.error("❌ Error al generar estructura de curso:", error)
    console.error("📊 Stack trace:", error.stack)

    // Determinar el tipo de error y proporcionar mensaje específico
    let errorMessage = "Error desconocido al generar la estructura"

    if (error.message?.includes("API key")) {
      errorMessage = "Error de configuración: Clave de API inválida o no configurada"
    } else if (error.message?.includes("quota")) {
      errorMessage = "Error de cuota: Se ha agotado el límite de la API"
    } else if (error.message?.includes("rate limit")) {
      errorMessage = "Error de límite: Demasiadas solicitudes, intenta de nuevo en unos minutos"
    } else if (error.message?.includes("network")) {
      errorMessage = "Error de conexión: Verifica tu conexión a internet"
    } else if (error.message) {
      errorMessage = error.message
    }

    console.log("📤 Retornando error:", errorMessage)
    return { error: errorMessage }
  }
}

export async function generateMaterialSuggestions(
  courseData: Partial<CourseData>,
  context: {
    theoreticalContext: string
    practicalContext: string
  },
): Promise<string> {
  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar sugerencias de materiales")
  }

  try {
    console.log("Generating material suggestions for:", courseData.title)

    const systemPrompt = `Eres un diseñador instruccional experto especializado en crear materiales educativos que conecten efectivamente la teoría con la práctica. Tu misión es diseñar una lista de materiales y recursos altamente relevantes para un curso específico.`

    // Convertir estructura de módulos a string para el prompt
    const structureText = Array.isArray(courseData.structure)
      ? courseData.structure.map((module, index) => `${index + 1}. ${module.title}: ${module.description}`).join("\n")
      : "No especificada"

    const prompt = `
**INFORMACIÓN DEL CURSO:**
- Título: "${courseData.title}"
- Audiencia: "${courseData.audience || "estudiantes"}"
- Problema que resuelve: "${courseData.problem || "No especificado"}"
- Propósito: "${courseData.purpose || "No especificado"}"

**ESTRUCTURA DE MÓDULOS:**
${structureText}

**ANÁLISIS DEL EXPERTO TEÓRICO:**
"""
${context.theoreticalContext}
"""

**ANÁLISIS DEL EXPERTO PRÁCTICO:**
"""
${context.practicalContext}
"""

**TU TAREA:**
Basándote en la SÍNTESIS de toda la información proporcionada, diseña una lista completa de materiales y recursos que:

1. Conecten directamente la teoría académica con las aplicaciones prácticas
2. Sean específicamente relevantes para los módulos listados en la estructura
3. Faciliten la transición del conocimiento conceptual a la implementación real
4. Incluyan diferentes tipos de recursos (didácticos, multimedia, herramientas, actividades)

**REQUISITOS ESPECÍFICOS:**
- Si la estructura tiene módulos definidos, sugiere 1-2 materiales específicos para al menos dos de esos módulos
- Balancea materiales teóricos con materiales prácticos
- Considera las necesidades específicas de la audiencia: "${courseData.audience || "estudiantes"}"

Formato la respuesta como una lista con viñetas (usando guiones), un material por línea.
`

    // Usar el servicio unificado con preferencia por Cohere para sugerencias de materiales
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "cohere", // Preferir Cohere para sugerencias creativas
      fallbackProviders: ["openai", "anthropic", "google"],
      maxTokens: 1500,
      temperature: 0.7,
    })

    console.log(`Sugerencias de materiales generadas con ${result.provider}`)
    return result.text
  } catch (error: any) {
    console.error("Error al generar sugerencias de materiales:", error)

    // Provide fallback content in case of error
    return `- Presentaciones digitales para cada módulo
- Guías de ejercicios prácticos
- Videos tutoriales complementarios
- Lecturas recomendadas en formato PDF
- Plantillas de trabajo para actividades
- Cuestionarios de autoevaluación
- Foros de discusión para cada tema
- Estudios de caso relevantes`
  }
}

export async function generateEvaluationMethod(courseData: CourseData): Promise<string | { error: string }> {
  try {
    const { title, theoreticalContext, practicalContext, structure } = courseData
    if (!title) {
      return { error: "Se requiere el título del curso para generar métodos de evaluación." }
    }

    // Convertir estructura de módulos a string para el prompt si existe
    const structureText = Array.isArray(structure)
      ? structure.map((module, index) => `${index + 1}. ${module.title}: ${module.description}`).join("\n")
      : "No especificada"

    const systemPrompt = `Eres un diseñador instruccional experto especializado en evaluación educativa. Tu tarea es diseñar métodos de evaluación para un curso específico.`

    const prompt = `
Diseña métodos de evaluación para un curso titulado "${title}".

CONTEXTO DEL CURSO:
- Contexto Teórico: ${theoreticalContext || "No proporcionado."}
- Contexto Práctico: ${practicalContext || "No proporcionado."}
- Estructura del Curso: 
${structureText}

Basándote en TODA la información anterior, genera una lista de métodos de evaluación variados y efectivos.
Incluye una mezcla de evaluación formativa (para medir el progreso durante el curso) y sumativa (para medir el resultado final).
Para cada método, describe brevemente cómo se implementaría y qué objetivo de aprendizaje específico evalúa.

La salida debe ser en formato Markdown.
`

    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "openai",
      fallbackProviders: ["cohere", "anthropic", "google"],
      maxTokens: 800,
      temperature: 0.7,
    })

    return result.text || "No se pudieron generar sugerencias."
  } catch (error: any) {
    console.error("Error generating evaluation methods:", error)
    return { error: "No se pudo contactar al servicio de IA para generar sugerencias de evaluación." }
  }
}

// Función para validar datos del curso
export function validateCourseData(courseData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!courseData) {
    errors.push("No se proporcionaron datos del curso")
    return { isValid: false, errors }
  }

  if (!courseData.title || courseData.title.trim() === "") {
    errors.push("El título del curso es requerido")
  }

  if (!courseData.audience || courseData.audience.trim() === "") {
    errors.push("La audiencia objetivo es requerida")
  }

  if (!courseData.problem || courseData.problem.trim() === "") {
    errors.push("El problema que resuelve el curso es requerido")
  }

  if (!courseData.purpose || courseData.purpose.trim() === "") {
    errors.push("El propósito del curso es requerido")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
