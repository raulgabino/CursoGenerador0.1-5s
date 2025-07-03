"use server"

import { generateTextWithAI } from "@/services/unified-ai-service"
import type { CourseData } from "@/types/course"

/**
 * Generate AI-suggested structure for a course using unified AI service
 */
export async function generateCourseStructure(
  courseData: Partial<CourseData>,
  context: {
    theoreticalContext: string
    practicalContext: string
  },
): Promise<string> {
  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar una estructura")
  }

  try {
    console.log("Generating course structure for:", courseData.title)

    // Prompt mejorado que sintetiza ambos contextos
    const systemPrompt = `Eres un diseñador instruccional de élite, experto en crear planes de estudio coherentes. Tu misión es sintetizar las perspectivas de dos expertos para diseñar la estructura de un curso.`

    const prompt = `
    **Información del Curso:**
    - Título: ${courseData.title}
    - Audiencia: ${courseData.audience || "estudiantes"}
    - Problema que resuelve: ${courseData.problem || "No especificado"}
    - Propósito: ${courseData.purpose || "No especificado"}
    - Experiencia previa requerida: ${courseData.experience || "No especificada"}
    - Duración: ${courseData.duration || "un curso estándar"}

    **Contexto del Experto Teórico (Análisis Académico):**
    """
    ${context.theoreticalContext}
    """

    **Contexto del Experto Práctico (Análisis de Aplicaciones):**
    """
    ${context.practicalContext}
    """

    **Tu Tarea:**
    Basado en la SÍNTESIS de AMBOS análisis de expertos, crea una estructura de curso de 4 a 8 módulos. La estructura debe fluir lógicamente desde los fundamentos teóricos hacia las aplicaciones prácticas. Asegúrate de que cada módulo conecte la teoría con la práctica.

    Proporciona una estructura de curso con:
    - Entre 4 y 8 módulos numerados
    - Cada módulo debe tener un título claro y descriptivo
    - Los módulos deben seguir una progresión lógica que integre teoría y práctica
    - La estructura debe ser adecuada para ${courseData.duration || "un curso estándar"}

    Formato la respuesta como una lista numerada simple, un módulo por línea.
    Ejemplo:
    1. Introducción a [tema]
    2. Fundamentos de [concepto clave]
    ...
    `

    // Usar el servicio unificado con preferencia por OpenAI para estructuración
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "openai", // Preferir OpenAI para estructuración de cursos
      fallbackProviders: ["cohere", "anthropic", "google"],
      maxTokens: 1500,
      temperature: 0.7,
    })

    console.log(`Estructura del curso generada con ${result.provider}`)
    return result.text
  } catch (error: any) {
    console.error("Error al generar estructura del curso:", error)

    // Provide fallback content in case of error
    return `1. Introducción a ${courseData.title || "la materia"}
2. Fundamentos teóricos y conceptos clave
3. Aplicaciones prácticas y casos de estudio
4. Herramientas y técnicas avanzadas
5. Evaluación y retroalimentación
6. Proyecto final y cierre del curso`
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

/**
 * Generate AI-suggested evaluation method for a course using unified AI service
 */
export async function generateEvaluationMethod(
  courseData: Partial<CourseData>,
  context?: {
    theoreticalContext: string
    practicalContext: string
  },
): Promise<string> {
  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar un método de evaluación")
  }

  try {
    console.log("Generating evaluation method for:", courseData.title)

    const systemPrompt = `Eres un experto en evaluación educativa especializado en diseñar métodos de evaluación que midan efectivamente el logro de objetivos de aprendizaje. Tu misión es crear un método de evaluación coherente y práctico para un curso específico.`

    const prompt = `
**INFORMACIÓN COMPLETA DEL CURSO:**
- Título: "${courseData.title}"
- Audiencia: "${courseData.audience || "estudiantes"}"
- Problema que resuelve: "${courseData.problem || "No especificado"}"
- Propósito principal: "${courseData.purpose || "No especificado"}"
- Experiencia previa requerida: "${courseData.experience || "No especificada"}"
- Duración: "${courseData.duration || "No especificada"}"
- Tipo de evaluación preferida: "${courseData.evaluationType || "mixta"}"
- Se otorgará certificado: ${courseData.certificate ? "Sí" : "No"}

**ESTRUCTURA DEL CURSO:**
${courseData.structure || "No especificada"}

**MATERIALES PROPUESTOS:**
${courseData.materials || "No especificados"}

${
  context
    ? `**CONTEXTO DEL EXPERTO TEÓRICO:**
"""
${context.theoreticalContext}
"""

**CONTEXTO DEL EXPERTO PRÁCTICO:**
"""
${context.practicalContext}
"""`
    : ""
}

**TU TAREA:**
Diseña un método de evaluación detallado (párrafo de 3 a 5 líneas) que:

1. **Mida directamente si el propósito del curso se cumplió**: "${courseData.purpose || "No especificado"}"
2. **Sea coherente con la estructura de módulos** y los materiales propuestos
3. **Sea práctica y aplicable** para la audiencia: "${courseData.audience || "estudiantes"}"
4. **Respete el tipo de evaluación preferida**: "${courseData.evaluationType || "mixta"}"
5. **Integre tanto aspectos teóricos como prácticos** del aprendizaje

Proporciona un párrafo detallado pero conciso (3-5 líneas máximo) que describa el método de evaluación completo.
`

    // Usar el servicio unificado con preferencia por Anthropic para evaluación educativa
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "anthropic", // Preferir Claude para evaluación educativa
      fallbackProviders: ["openai", "cohere", "google"],
      maxTokens: 300,
      temperature: 0.7,
    })

    console.log(`Método de evaluación generado con ${result.provider}`)
    return result.text
  } catch (error: any) {
    console.error("Error al generar método de evaluación:", error)

    // Provide fallback content in case of error
    const evaluationType = courseData.evaluationType || "mixta"
    let fallbackContent = ""

    if (evaluationType === "manual") {
      fallbackContent = `La evaluación se realizará mediante un proyecto final donde los participantes aplicarán los conocimientos adquiridos en ${courseData.title || "el curso"} para resolver el problema "${courseData.problem || "identificado"}". El instructor evaluará el proyecto según una rúbrica que considera la comprensión de conceptos clave, aplicación práctica y creatividad en la solución propuesta. Se proporcionará retroalimentación personalizada a cada participante para reforzar su aprendizaje y verificar el cumplimiento del propósito: "${courseData.purpose || "objetivos del curso"}".`
    } else if (evaluationType === "automatica") {
      fallbackContent = `La evaluación se realizará mediante cuestionarios automatizados al final de cada módulo de la estructura propuesta y un examen final que abarca todos los contenidos de ${courseData.title || "el curso"}. Cada evaluación tendrá un peso específico en la calificación final, siendo necesario obtener al menos un 70% para demostrar que se cumplió el propósito: "${courseData.purpose || "objetivos del curso"}". Los resultados se entregarán inmediatamente para permitir la autorreflexión y verificar la capacidad de resolver "${courseData.problem || "el problema identificado"}".`
    } else {
      fallbackContent = `La evaluación combinará métodos automatizados y manuales: cuestionarios de opción múltiple al finalizar cada módulo de la estructura (40%), participación en foros de discusión (20%) y un proyecto final (40%) donde los participantes aplicarán lo aprendido en ${courseData.title || "el curso"} para resolver "${courseData.problem || "el problema identificado"}". Se proporcionará retroalimentación personalizada en el proyecto final y se requerirá un mínimo de 70% para demostrar el cumplimiento del propósito: "${courseData.purpose || "objetivos del curso"}".`
    }

    return fallbackContent
  }
}
