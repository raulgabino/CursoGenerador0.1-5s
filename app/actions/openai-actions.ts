"use server"

import { generateTextWithAI } from "@/services/unified-ai-service"
import type { CourseData } from "@/types/course"
import type { Presentation } from "@/services/presentation-service"

/**
 * Generate additional materials for a course using unified AI service
 */
export async function generateAdditionalMaterials(courseData: CourseData): Promise<string> {
  if (!courseData || !courseData.title) {
    throw new Error("Datos del curso incompletos o inválidos")
  }

  try {
    console.log("Generating additional materials for course:", courseData.title)

    const systemPrompt = `Eres un experto en diseño instruccional y educación. Tu tarea es recomendar materiales adicionales de alta calidad para complementar un curso.`

    const prompt = `
    Genera una lista de materiales adicionales recomendados para un curso titulado "${courseData.title}" 
    dirigido a "${courseData.audience || "estudiantes"}".
    
    Información del curso:
    - Problema que resuelve: "${courseData.problem || "No especificado"}"
    - Propósito: "${courseData.purpose || "No especificado"}"
    - Estructura: "${courseData.structure || "No especificada"}"
    - Evaluación: "${courseData.evaluationMethod || "No especificada"}"
    
    Proporciona una lista organizada de:
    1. Libros recomendados (3-5)
    2. Recursos en línea (sitios web, cursos, videos)
    3. Herramientas útiles para el aprendizaje
    
    Formato la respuesta en Markdown.
    `

    // Usar el servicio unificado con preferencia por Cohere para materiales adicionales
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "cohere", // Preferir Cohere para recomendaciones creativas
      fallbackProviders: ["openai", "anthropic", "google"],
      maxTokens: 1500,
      temperature: 0.7,
    })

    console.log(`Materiales adicionales generados con ${result.provider}`)
    return result.text
  } catch (error: any) {
    console.error("Error al generar materiales adicionales:", error)

    // Provide fallback content in case of error
    return `
## Libros recomendados
- "Introducción a ${courseData.title || "la materia"}" por Autor Reconocido
- "Fundamentos de ${courseData.audience ? "enseñanza para " + courseData.audience : "pedagogía"}" por Experto Educativo
- "Guía práctica de ${courseData.title || "enseñanza efectiva"}" por Pedagogo Destacado

## Recursos en línea
- Plataforma EdX: cursos gratuitos sobre ${courseData.title || "la materia"}
- Canal de YouTube "Educación Innovadora"
- Sitio web Coursera: especialización en ${courseData.title || "diseño instruccional"}

## Herramientas
- Miro para mapas mentales colaborativos
- Kahoot para evaluaciones interactivas
- Canva para diseño de materiales educativos
    `
  }
}

/**
 * Generate a presentation structure for a course using unified AI service
 */
export async function generatePresentation(courseData: CourseData): Promise<Presentation> {
  try {
    if (!courseData || !courseData.title) {
      throw new Error("Datos del curso incompletos o inválidos")
    }

    console.log("Generating presentation for course:", courseData.title)

    const systemPrompt = `Eres un experto en diseño de presentaciones educativas. 
    Tu tarea es crear una estructura de presentación concisa y efectiva para un curso.
    Debes proporcionar exactamente 6 slides, con títulos claros y puntos clave concisos.
    Cada punto debe ser una frase completa pero breve, fácil de leer en una presentación.
    El formato debe ser JSON válido y seguir exactamente la estructura especificada.`

    const prompt = `Genera una presentación concisa para un curso titulado "${courseData.title}" dirigido a "${courseData.audience || "estudiantes"}".

Información del curso:
- Problema que resuelve: "${courseData.problem || "No especificado"}"
- Propósito: "${courseData.purpose || "No especificado"}"
- Estructura: "${courseData.structure || "No especificada"}"
- Evaluación: "${courseData.evaluationMethod || "No especificada"}"

INSTRUCCIONES ESPECÍFICAS:
1. Crea EXACTAMENTE 6 slides en total.
2. La primera slide debe ser la portada con el título del curso.
3. La segunda slide debe presentar el problema y propósito.
4. Las slides 3-5 deben cubrir los puntos clave del contenido.
5. La última slide debe ser sobre evaluación y cierre.

Para cada slide, proporciona:
- Un título conciso y atractivo
- 3-5 puntos clave en formato de bullets (sin sub-bullets)
- Cada punto debe ser claro, conciso y directamente relacionado con el título de la slide
- Notas opcionales para el presentador

Formato de respuesta requerido (JSON):
{
"title": "Título del curso",
"author": "Nombre del autor",
"date": "Fecha actual",
"slides": [
  {
    "title": "Título de la slide",
    "content": ["Punto 1", "Punto 2", "Punto 3"],
    "notes": "Notas para el presentador (opcional)"
  },
  ...
]
}`

    console.log("Sending request to AI service...")

    // Usar el servicio unificado con preferencia por OpenAI para presentaciones estructuradas
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "openai", // Preferir OpenAI para JSON estructurado
      fallbackProviders: ["cohere", "anthropic", "google"],
      maxTokens: 2000,
      temperature: 0.7,
    })

    console.log(`Presentación generada con ${result.provider}`)
    console.log("Response content:", result.text.substring(0, 100) + "...")

    try {
      const presentation = JSON.parse(result.text) as Presentation

      // Ensure there are exactly 6 slides
      if (presentation.slides.length > 6) {
        presentation.slides = presentation.slides.slice(0, 6)
      } else if (presentation.slides.length < 6) {
        // Add missing slides if there are fewer than 6
        const defaultTitles = [
          "Introducción al Curso",
          "Problema y Propósito",
          "Contenido Principal",
          "Metodología",
          "Estructura del Curso",
          "Evaluación y Cierre",
        ]

        while (presentation.slides.length < 6) {
          const index = presentation.slides.length
          presentation.slides.push({
            title: defaultTitles[index],
            content: ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
            notes: "Slide generada automáticamente",
          })
        }
      }

      // Ensure each slide has at least 3 content points
      presentation.slides.forEach((slide) => {
        if (!Array.isArray(slide.content) || slide.content.length < 3) {
          slide.content = slide.content || []
          while (slide.content.length < 3) {
            slide.content.push(`Punto clave ${slide.content.length + 1}`)
          }
        }

        // Limit to 5 points maximum per slide
        if (slide.content.length > 5) {
          slide.content = slide.content.slice(0, 5)
        }

        // Ensure points are not empty
        slide.content = slide.content.map((point) =>
          point && point.trim() ? point : `Punto clave generado automáticamente`,
        )
      })

      // Set current date if not present
      if (!presentation.date) {
        presentation.date = new Date().toLocaleDateString()
      }

      // Set author if not present
      if (!presentation.author) {
        presentation.author = "Generado con Whorkshop"
      }

      // Ensure title is present
      if (!presentation.title) {
        presentation.title = courseData.title
      }

      return presentation
    } catch (parseError) {
      console.error("Error parsing presentation JSON:", parseError)
      console.error("Raw content:", result.text)
      throw new Error("Error processing AI response")
    }
  } catch (error: any) {
    console.error("Error generating presentation:", error)

    // Return a basic presentation in case of error
    return {
      title: courseData?.title || "Curso sin título",
      author: "Generado con Whorkshop",
      date: new Date().toLocaleDateString(),
      slides: [
        {
          title: courseData?.title || "Curso sin título",
          content: [
            "Curso generado con Whorkshop",
            "Presentación básica de emergencia",
            "Contacte al soporte si ve este mensaje",
          ],
        },
        {
          title: "Problema y Propósito",
          content: [
            courseData?.problem || "Problema no especificado",
            courseData?.purpose || "Propósito no especificado",
            "Dirigido a: " + (courseData?.audience || "Audiencia no especificada"),
          ],
        },
        {
          title: "Contenido Principal",
          content: ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
        },
        {
          title: "Metodología",
          content: ["Enfoque práctico", "Aprendizaje colaborativo", "Aplicación real"],
        },
        {
          title: "Estructura del Curso",
          content: courseData?.structure
            ? courseData.structure.split("\n").slice(0, 3)
            : ["Módulo 1", "Módulo 2", "Módulo 3"],
        },
        {
          title: "Evaluación",
          content: [
            courseData?.evaluationMethod || "Método de evaluación no especificado",
            courseData?.evaluationType || "Tipo de evaluación no especificado",
            courseData?.certificate ? "Se otorgará certificado" : "No se otorgará certificado",
          ],
        },
      ],
    }
  }
}
