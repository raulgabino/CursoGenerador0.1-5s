"use server"

import OpenAI from "openai"
import { generateTextWithAI } from "@/services/unified-ai-service"
import type { CourseData, CourseModule } from "@/types/course"

export async function generateCourseStructure(courseData: CourseData): Promise<CourseModule[] | { error: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const { title, theoreticalContext, practicalContext } = courseData
  if (!title) {
    return { error: "Se requiere un título para generar la estructura del curso." }
  }

  const prompt = `
    Actúa como un diseñador instruccional experto. Tu tarea es diseñar una estructura de módulos detallada para un curso titulado "${title}".
    
    CONTEXTO PROPORCIONADO POR EXPERTOS:
    - Contexto Teórico (de un catedrático): ${theoreticalContext || "No proporcionado. Basa tu estructura en conocimiento general sobre el tema."}
    - Contexto Práctico (de un consultor de industria): ${practicalContext || "No proporcionado."}
    
    INSTRUCCIONES CRÍTICAS:
    1. Sintetiza la información de AMBOS contextos para crear una estructura de curso lógica y coherente.
    2. La estructura debe consistir en 4-8 módulos principales.
    3. Para cada módulo, proporciona un título claro y una descripción detallada (2-3 frases) de sus contenidos.
    4. OBLIGATORIO: Devuelve ÚNICAMENTE un array JSON válido con el siguiente formato exacto:
    
    [
      {
        "moduleName": "Título del módulo 1",
        "moduleDescription": "Descripción detallada del módulo 1 que explique qué aprenderán los estudiantes y qué temas se cubrirán."
      },
      {
        "moduleName": "Título del módulo 2", 
        "moduleDescription": "Descripción detallada del módulo 2 que explique qué aprenderán los estudiantes y qué temas se cubrirán."
      }
    ]
    
    5. NO incluyas texto adicional, explicaciones o formato markdown. Solo el JSON válido.
    6. Asegúrate de que el JSON sea parseable y válido.
  `

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.3, // Reducir temperatura para respuestas más consistentes
      max_tokens: 1500,
    })

    const content = response.choices[0].message.content || ""

    // Intentar parsear el JSON
    try {
      const modules = JSON.parse(content) as CourseModule[]

      // Validar que sea un array y que tenga la estructura correcta
      if (!Array.isArray(modules)) {
        throw new Error("La respuesta no es un array")
      }

      // Validar cada módulo
      for (const module of modules) {
        if (!module.moduleName || !module.moduleDescription) {
          throw new Error("Estructura de módulo inválida")
        }
      }

      return modules
    } catch (parseError) {
      console.error("Error parsing JSON from AI:", parseError)
      console.error("AI Response:", content)

      // Fallback: intentar extraer información y crear estructura manualmente
      return [
        {
          moduleName: "Módulo 1: Introducción",
          moduleDescription: "Introducción a los conceptos fundamentales del curso.",
        },
        {
          moduleName: "Módulo 2: Desarrollo",
          moduleDescription: "Desarrollo de habilidades y conocimientos intermedios.",
        },
        {
          moduleName: "Módulo 3: Aplicación",
          moduleDescription: "Aplicación práctica de los conocimientos adquiridos.",
        },
      ]
    }
  } catch (error) {
    console.error("Error generating course structure:", error)
    return { error: "No se pudo contactar al servicio de IA para generar la estructura del curso." }
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
    const structureText = courseData.structure
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
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const { title, theoreticalContext, practicalContext, structure } = courseData
  if (!title || !structure) {
    return { error: "Se requiere el título y la estructura del curso para generar métodos de evaluación." }
  }

  // Convertir estructura de módulos a string para el prompt
  const structureText = structure
    .map((module, index) => `${index + 1}. ${module.moduleName}: ${module.moduleDescription}`)
    .join("\n")

  const prompt = `
    Actúa como un diseñador instruccional experto especializado en evaluación educativa.
    Tu tarea es diseñar métodos de evaluación para un curso titulado "${title}".
    
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

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    })

    return response.choices[0].message.content || "No se pudieron generar sugerencias."
  } catch (error) {
    console.error("Error generating evaluation methods:", error)
    return { error: "No se pudo contactar al servicio de IA para generar sugerencias de evaluación." }
  }
}
