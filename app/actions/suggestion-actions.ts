"use server"

import OpenAI from "openai"
import type { CourseData } from "@/types/course"
// import { generateExpertContext } from "@/services/context-service"

// Initialize OpenAI client (server-side only)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// Add a validation check at the beginning of each function
function validateApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key is missing")
    throw new Error("API key configuration error. Please check server configuration.")
  }
}

/**
 * Generate AI-suggested structure for a course
 */
export async function generateCourseStructure(
  courseData: Partial<CourseData>,
  context: {
    theoreticalContext: string
    practicalContext: string
  },
): Promise<string> {
  validateApiKey()

  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar una estructura")
  }

  try {
    console.log("Generating course structure for:", courseData.title)

    // Obtener contexto enriquecido del panel de expertos
    // const { theoreticalContext, practicalContext } = await generateExpertContext(courseData.title)

    // Prompt mejorado que sintetiza ambos contextos
    const finalPrompt = `
    Eres un diseñador instruccional de élite, experto en crear planes de estudio coherentes. Tu misión es sintetizar las perspectivas de dos expertos para diseñar la estructura de un curso.

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en diseño instruccional y educación. Tu tarea es crear estructuras de cursos efectivas y bien organizadas que integren perspectivas teóricas y prácticas.",
        },
        {
          role: "user",
          content: finalPrompt,
        },
      ],
      temperature: 0.7,
    })

    console.log("OpenAI API response received for enhanced course structure")
    const content = response.choices[0]?.message?.content || ""

    if (!content || content.trim() === "") {
      console.error("Empty response from OpenAI API")
      throw new Error("La respuesta de la API está vacía")
    }

    return content
  } catch (error: any) {
    console.error("Error al generar estructura del curso:", error)

    // Log more detailed error information
    if (error.response) {
      console.error("OpenAI API error response:", {
        status: error.response.status,
        data: error.response.data,
      })
    }

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
 * Generate AI-suggested materials and resources for a course
 */
export async function generateMaterialSuggestions(
  courseData: Partial<CourseData>,
  context: {
    theoreticalContext: string
    practicalContext: string
  },
): Promise<string> {
  validateApiKey()

  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar sugerencias de materiales")
  }

  try {
    console.log("Generating material suggestions for:", courseData.title)

    const prompt = `
Eres un diseñador instruccional experto especializado en crear materiales educativos que conecten efectivamente la teoría con la práctica. Tu misión es diseñar una lista de materiales y recursos altamente relevantes para un curso específico.

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
Basándote en la SÍNTESIS de toda la información proporcionada (datos del curso, estructura de módulos, contexto teórico y contexto práctico), diseña una lista completa de materiales y recursos que:

1. Conecten directamente la teoría académica con las aplicaciones prácticas
2. Sean específicamente relevantes para los módulos listados en la estructura
3. Faciliten la transición del conocimiento conceptual a la implementación real
4. Incluyan diferentes tipos de recursos (didácticos, multimedia, herramientas, actividades)

**REQUISITOS ESPECÍFICOS:**
- Si la estructura tiene módulos definidos, sugiere 1-2 materiales específicos para al menos dos de esos módulos, mencionando explícitamente el módulo al que corresponden
- Balancea materiales teóricos (que refuercen los conceptos académicos) con materiales prácticos (que faciliten la aplicación)
- Considera las necesidades específicas de la audiencia: "${courseData.audience || "estudiantes"}"

Formato la respuesta como una lista con viñetas (usando guiones), un material por línea.
Ejemplo:
- Presentaciones digitales que integren teoría y casos prácticos para cada módulo
- Guía de ejercicios prácticos específica para [Módulo X]: [descripción específica]
- Videos tutoriales sobre [tema específico del Módulo Y]
- Plantillas de trabajo para aplicar [concepto teórico específico]
...
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en diseño instruccional y educación. Tu tarea es recomendar materiales y recursos efectivos para cursos educativos.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    console.log("OpenAI API response received for material suggestions")
    const content = response.choices[0]?.message?.content || ""

    if (!content || content.trim() === "") {
      console.error("Empty response from OpenAI API")
      throw new Error("La respuesta de la API está vacía")
    }

    return content
  } catch (error: any) {
    console.error("Error al generar sugerencias de materiales:", error)

    // Log more detailed error information
    if (error.response) {
      console.error("OpenAI API error response:", {
        status: error.response.status,
        data: error.response.data,
      })
    }

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
 * Generate AI-suggested evaluation method for a course
 */
export async function generateEvaluationMethod(
  courseData: Partial<CourseData>,
  context?: {
    theoreticalContext: string
    practicalContext: string
  },
): Promise<string> {
  validateApiKey()

  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar un método de evaluación")
  }

  try {
    console.log("Generating evaluation method for:", courseData.title)

    const prompt = `
Eres un experto en evaluación educativa especializado en diseñar métodos de evaluación que midan efectivamente el logro de objetivos de aprendizaje. Tu misión es crear un método de evaluación coherente y práctico para un curso específico.

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

**REQUISITOS ESPECÍFICOS:**
- El método debe demostrar que los participantes pueden resolver el problema identificado: "${courseData.problem || "No especificado"}"
- Debe incluir criterios claros de evaluación
- Debe especificar cómo se medirá el aprendizaje de manera concreta
- Debe ser realista para implementar con la audiencia objetivo

Proporciona un párrafo detallado pero conciso (3-5 líneas máximo) que describa el método de evaluación completo.
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en evaluación educativa y diseño instruccional. Tu tarea es crear métodos de evaluación efectivos, coherentes y prácticos que midan el logro real de objetivos de aprendizaje.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    console.log("OpenAI API response received for evaluation method")
    const content = response.choices[0]?.message?.content || ""

    if (!content || content.trim() === "") {
      console.error("Empty response from OpenAI API")
      throw new Error("La respuesta de la API está vacía")
    }

    return content
  } catch (error: any) {
    console.error("Error al generar método de evaluación:", error)

    // Log more detailed error information
    if (error.response) {
      console.error("OpenAI API error response:", {
        status: error.response.status,
        data: error.response.data,
      })
    }

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
