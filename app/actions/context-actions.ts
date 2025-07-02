"use server"

import { generateExpertContext } from "@/services/context-service"
import type { CourseData } from "@/types/course"

/**
 * Server Action para obtener el contexto de los expertos (Claude y Gemini)
 * Esta función desacopla la generación de conocimiento del diseño de la estructura
 */
export async function getExpertContextForCourse(courseData: Partial<CourseData>): Promise<{
  theoreticalContext: string
  practicalContext: string
}> {
  try {
    // Validar que se proporcione al menos el título del curso
    if (!courseData || !courseData.title) {
      throw new Error("Se requiere al menos el título del curso para generar el contexto de los expertos")
    }

    console.log(`Expert context generation started for: ${courseData.title}`)

    // Llamar al servicio para obtener el contexto de ambos expertos
    const { theoreticalContext, practicalContext } = await generateExpertContext(courseData.title)

    // Registrar en la consola el éxito de la operación
    console.log(`Expert context generated for ${courseData.title}`)

    // Devolver el contexto de ambos expertos
    return {
      theoreticalContext,
      practicalContext,
    }
  } catch (error: any) {
    // Registrar el error en la consola para debugging
    console.error("Error al generar el contexto de los expertos:", error)

    // Lanzar una nueva excepción con un mensaje más amigable
    throw new Error("Error al generar el contexto de los expertos. Por favor, revisa la configuración de las APIs.")
  }
}
