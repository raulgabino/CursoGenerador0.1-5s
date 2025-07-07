"use server"

import { generateTextWithAI } from "@/services/unified-ai-service"
import type { CourseData, CourseModule } from "@/types/course"

export async function generateCourseStructure(courseData: CourseData): Promise<CourseModule[] | { error: string }> {
  try {
    console.log("🔍 DIAGNÓSTICO - generateCourseStructure iniciado con:", courseData.title)

    const { title, theoreticalContext, practicalContext } = courseData
    if (!title) {
      return { error: "Se requiere un título para generar la estructura del curso." }
    }

    // Crear un prompt más robusto
    const systemPrompt = `Eres un diseñador instruccional experto. Tu tarea es crear una estructura de módulos para un curso educativo.

INSTRUCCIONES CRÍTICAS:
1. Debes devolver ÚNICAMENTE un array JSON válido con la estructura exacta especificada.
2. NO incluyas texto adicional, explicaciones o formato markdown.
3. El JSON debe ser parseable directamente.
4. Cada módulo debe tener exactamente las propiedades: moduleName y moduleDescription.`

    const prompt = `
Crea una estructura de 4-6 módulos para un curso titulado "${title}".

${theoreticalContext ? `Contexto Teórico: ${theoreticalContext}` : ""}
${practicalContext ? `Contexto Práctico: ${practicalContext}` : ""}

Información adicional del curso:
- Audiencia: ${courseData.audience || "No especificada"}
- Problema que resuelve: ${courseData.problem || "No especificado"}
- Propósito: ${courseData.purpose || "No especificado"}

Devuelve ÚNICAMENTE un array JSON con este formato exacto:
[
  {
    "moduleName": "Título del módulo 1",
    "moduleDescription": "Descripción detallada del módulo 1 que explique qué aprenderán los estudiantes."
  },
  {
    "moduleName": "Título del módulo 2", 
    "moduleDescription": "Descripción detallada del módulo 2 que explique qué aprenderán los estudiantes."
  }
]

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`

    console.log("🔍 DIAGNÓSTICO - Llamando a generateTextWithAI...")

    // Usar el servicio unificado de IA
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "openai", // Preferir OpenAI para JSON estructurado
      fallbackProviders: ["cohere", "anthropic", "google"],
      maxTokens: 1500,
      temperature: 0.3, // Temperatura baja para respuestas más consistentes
    })

    console.log("🔍 DIAGNÓSTICO - Respuesta de IA recibida:", result.text.substring(0, 200) + "...")

    if (!result.text) {
      console.error("🔍 DIAGNÓSTICO - Respuesta vacía de la IA")
      return { error: "No se recibió respuesta de la IA." }
    }

    // Limpiar la respuesta para extraer solo el JSON
    let cleanedResponse = result.text.trim()

    // Remover posibles bloques de código markdown
    const jsonMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[1].trim()
    }

    // Intentar parsear el JSON
    try {
      const modules = JSON.parse(cleanedResponse) as CourseModule[]

      // Validar que sea un array
      if (!Array.isArray(modules)) {
        console.error("🔍 DIAGNÓSTICO - La respuesta no es un array:", typeof modules)
        throw new Error("La respuesta no es un array válido")
      }

      // Validar cada módulo
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i]
        if (!module || typeof module !== "object") {
          console.error(`🔍 DIAGNÓSTICO - Módulo ${i} no es un objeto válido:`, module)
          throw new Error(`Módulo ${i + 1} no es válido`)
        }

        if (!module.moduleName || typeof module.moduleName !== "string") {
          console.error(`🔍 DIAGNÓSTICO - Módulo ${i} no tiene moduleName válido:`, module.moduleName)
          throw new Error(`Módulo ${i + 1} no tiene un nombre válido`)
        }

        if (!module.moduleDescription || typeof module.moduleDescription !== "string") {
          console.error(`🔍 DIAGNÓSTICO - Módulo ${i} no tiene moduleDescription válido:`, module.moduleDescription)
          throw new Error(`Módulo ${i + 1} no tiene una descripción válida`)
        }
      }

      console.log("🔍 DIAGNÓSTICO - Estructura validada exitosamente:", modules.length, "módulos")
      return modules
    } catch (parseError) {
      console.error("🔍 DIAGNÓSTICO - Error parseando JSON:", parseError)
      console.error("🔍 DIAGNÓSTICO - Respuesta limpia:", cleanedResponse)

      // Fallback: crear estructura básica
      const fallbackModules: CourseModule[] = [
        {
          moduleName: "Módulo 1: Introducción",
          moduleDescription: `Introducción a los conceptos fundamentales de ${title}. Los estudiantes conocerán los objetivos del curso y las bases teóricas necesarias.`,
        },
        {
          moduleName: "Módulo 2: Fundamentos",
          moduleDescription: `Desarrollo de los conocimientos básicos sobre ${title}. Se cubrirán los principios y metodologías esenciales.`,
        },
        {
          moduleName: "Módulo 3: Aplicación Práctica",
          moduleDescription: `Aplicación práctica de los conocimientos adquiridos. Los estudiantes trabajarán en ejercicios y casos de estudio reales.`,
        },
        {
          moduleName: "Módulo 4: Proyecto Final",
          moduleDescription: `Integración de todos los conocimientos en un proyecto final. Los estudiantes demostrarán su dominio del tema.`,
        },
      ]

      console.log("🔍 DIAGNÓSTICO - Usando estructura fallback")
      return fallbackModules
    }
  } catch (error: any) {
    console.error("🔍 DIAGNÓSTICO - Error general en generateCourseStructure:", error)

    // Asegurar que siempre devolvemos un objeto con error
    const errorMessage = error?.message || error?.toString() || "Error desconocido al generar la estructura"
    return { error: `Error al generar estructura: ${errorMessage}` }
  }
}

/**
 * Generate AI-suggested materials and resources for a course using unified AI service
 */
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
      ? courseData.structure
          .map((module, index) => `${index + 1}. ${module.moduleName}: ${module.moduleDescription}`)
          .join("\n")
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
      ? structure.map((module, index) => `${index + 1}. ${module.moduleName}: ${module.moduleDescription}`).join("\n")
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
