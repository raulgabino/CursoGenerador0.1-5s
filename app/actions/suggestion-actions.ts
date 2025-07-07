"use server"

import { generateCourseStructureWithAI } from "@/services/generate-text-with-ai"
import type { CourseModule } from "@/types/course"

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

// Función para generar sugerencias de materiales
export async function generateMaterialSuggestions(
  courseData: any,
  modules: CourseModule[],
): Promise<string[] | { error: string }> {
  try {
    console.log("🚀 Iniciando generación de sugerencias de materiales...")

    const prompt = `
Basándote en la siguiente información del curso y sus módulos, sugiere materiales y recursos educativos:

Curso: ${courseData.title}
Audiencia: ${courseData.audience}
Modalidad: ${courseData.modality}
Duración: ${courseData.duration}

Módulos:
${modules.map((m) => `- ${m.title}: ${m.description}`).join("\n")}

Genera una lista de 8-12 materiales y recursos específicos que serían útiles para este curso.
Incluye diferentes tipos: presentaciones, documentos, videos, herramientas, plataformas, etc.

Responde con una lista simple, un elemento por línea, sin numeración.
`

    const { generateSimpleText } = await import("@/services/generate-text-with-ai")
    const response = await generateSimpleText(prompt, "Eres un experto en recursos educativos y diseño instruccional.")

    // Procesar la respuesta para extraer la lista
    const materials = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .slice(0, 12) // Limitar a 12 elementos

    console.log("✅ Sugerencias de materiales generadas:", materials.length)
    return materials
  } catch (error: any) {
    console.error("❌ Error al generar sugerencias de materiales:", error)
    return { error: `Error al generar sugerencias: ${error.message}` }
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
