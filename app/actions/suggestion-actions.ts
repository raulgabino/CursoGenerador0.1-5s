"use server"

import OpenAI from "openai"
import { generateTextWithAI } from "@/services/unified-ai-service"
import type { CourseData } from "@/types/course"

export async function generateCourseStructure(courseData: CourseData): Promise<string | { error: string }> {
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
    
    INSTRUCCIONES:
    1. Sintetiza la información de AMBOS contextos para crear una estructura de curso lógica y coherente.
    2. La estructura debe consistir en una lista de módulos o unidades principales.
    3. Para cada módulo, proporciona un título claro y una breve descripción (1-2 frases) de sus contenidos.
    4. El resultado debe ser una lista de módulos bien definida que cubra el tema de manera exhaustiva.
    5. Devuelve la lista de módulos en formato Markdown, usando guiones (-) para cada módulo.
  `

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.5,
      max_tokens: 1000, // <-- ESTE ES EL VALOR CORREGIDO
    })

    return response.choices[0].message.content || "No se pudieron generar sugerencias."
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

    const prompt = `
**INFORMACIÓN DEL CURSO:**
- Título: "${courseData.title}"
- Audiencia: "${courseData.audience || "estudiantes"}"
- Problema que resuelve: "${courseData.problem || "No especificado"}"
- Propósito: "${courseData.purpose || "No especificado"}"

**ESTRUCTURA DE MÓDULOS:**
${courseData.structure || "No especificada"}

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

  const prompt = `
    Actúa como un diseñador instruccional experto especializado en evaluación educativa.
    Tu tarea es diseñar métodos de evaluación para un curso titulado "${title}".
    
    CONTEXTO DEL CURSO:
    - Contexto Teórico: ${theoreticalContext || "No proporcionado."}
    - Contexto Práctico: ${practicalContext || "No proporcionado."}
    - Estructura del Curso: ${JSON.stringify(structure, null, 2)}
    
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
      max_tokens: 800, // <-- ESTE ES EL VALOR CORREGIDO
    })

    return response.choices[0].message.content || "No se pudieron generar sugerencias."
  } catch (error) {
    console.error("Error generating evaluation methods:", error)
    return { error: "No se pudo contactar al servicio de IA para generar sugerencias de evaluación." }
  }
}
