"use server"

import OpenAI from "openai"
import type { CourseData } from "@/types/course"

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
export async function generateCourseStructure(courseData: Partial<CourseData>): Promise<string> {
  validateApiKey()

  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar una estructura")
  }

  try {
    console.log("Generating course structure for:", courseData.title)

    const prompt = `
    Genera una estructura de curso detallada para un curso titulado "${courseData.title}" 
    dirigido a "${courseData.audience || "estudiantes"}".
    
    Información del curso:
    - Problema que resuelve: "${courseData.problem || "No especificado"}"
    - Propósito: "${courseData.purpose || "No especificado"}"
    - Experiencia previa requerida: "${courseData.experience || "No especificada"}"
    
    Proporciona una estructura de curso con:
    - Entre 4 y 8 módulos numerados
    - Cada módulo debe tener un título claro y descriptivo
    - Los módulos deben seguir una progresión lógica
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
            "Eres un experto en diseño instruccional y educación. Tu tarea es crear estructuras de cursos efectivas y bien organizadas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    console.log("OpenAI API response received for course structure")
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
export async function generateMaterialSuggestions(courseData: Partial<CourseData>): Promise<string> {
  validateApiKey()

  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar sugerencias de materiales")
  }

  try {
    console.log("Generating material suggestions for:", courseData.title)

    const prompt = `
    Genera una lista de materiales y recursos recomendados para un curso titulado "${courseData.title}" 
    dirigido a "${courseData.audience || "estudiantes"}".
    
    Información del curso:
    - Problema que resuelve: "${courseData.problem || "No especificado"}"
    - Propósito: "${courseData.purpose || "No especificado"}"
    - Estructura: "${courseData.structure || "No especificada"}"
    
    Proporciona una lista de:
    - Materiales didácticos (presentaciones, guías, etc.)
    - Recursos multimedia (videos, podcasts, etc.)
    - Herramientas digitales útiles para el curso
    - Actividades prácticas recomendadas
    
    Formato la respuesta como una lista con viñetas (usando guiones), un material por línea.
    Ejemplo:
    - Presentaciones digitales para cada módulo
    - Guías de ejercicios prácticos
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
export async function generateEvaluationMethod(courseData: Partial<CourseData>): Promise<string> {
  validateApiKey()

  if (!courseData || !courseData.title) {
    throw new Error("Se requiere al menos el título del curso para generar un método de evaluación")
  }

  try {
    console.log("Generating evaluation method for:", courseData.title)

    const prompt = `
    Genera un método de evaluación detallado para un curso titulado "${courseData.title}" 
    dirigido a "${courseData.audience || "estudiantes"}".
    
    Información del curso:
    - Problema que resuelve: "${courseData.problem || "No especificado"}"
    - Propósito: "${courseData.purpose || "No especificado"}"
    - Tipo de evaluación preferida: "${courseData.evaluationType || "mixta"}"
    - Se otorgará certificado: ${courseData.certificate ? "Sí" : "No"}
    
    Proporciona un método de evaluación que:
    - Sea coherente con los objetivos del curso
    - Incluya criterios claros de evaluación
    - Especifique cómo se medirá el aprendizaje
    - Sea adecuado para el público objetivo
    
    La respuesta debe ser un párrafo detallado pero conciso (máximo 5 líneas).
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en diseño instruccional y evaluación educativa. Tu tarea es crear métodos de evaluación efectivos y adecuados para cursos educativos.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 250,
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
      fallbackContent = `La evaluación se realizará mediante un proyecto final donde los participantes aplicarán los conocimientos adquiridos en ${courseData.title || "el curso"}. El instructor evaluará el proyecto según una rúbrica que considera la comprensión de conceptos clave, aplicación práctica y creatividad. Se proporcionará retroalimentación personalizada a cada participante para reforzar su aprendizaje.`
    } else if (evaluationType === "automatica") {
      fallbackContent = `La evaluación se realizará mediante cuestionarios automatizados al final de cada módulo y un examen final que abarca todos los contenidos de ${courseData.title || "el curso"}. Cada evaluación tendrá un peso específico en la calificación final, siendo necesario obtener al menos un 70% para aprobar. Los resultados se entregarán inmediatamente para permitir la autorreflexión.`
    } else {
      fallbackContent = `La evaluación combinará métodos automatizados y manuales: cuestionarios de opción múltiple al finalizar cada módulo (40%), participación en foros de discusión (20%) y un proyecto final (40%) donde los participantes aplicarán lo aprendido en ${courseData.title || "el curso"}. Se proporcionará retroalimentación personalizada en el proyecto final y se requerirá un mínimo de 70% para aprobar.`
    }

    return fallbackContent
  }
}

