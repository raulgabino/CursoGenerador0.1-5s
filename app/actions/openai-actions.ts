"use server"

import OpenAI from "openai"
import type { CourseData } from "@/types/course"
import type { Presentation } from "@/services/presentation-service"

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
 * Generate additional materials for a course
 */
export async function generateAdditionalMaterials(courseData: CourseData): Promise<string> {
  validateApiKey()

  if (!courseData || !courseData.title) {
    throw new Error("Datos del curso incompletos o inválidos")
  }

  try {
    console.log("Generating additional materials for course:", courseData.title)

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en diseño instruccional y educación. Tu tarea es recomendar materiales adicionales de alta calidad para complementar un curso.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    console.log("OpenAI API response received")
    const content = response.choices[0]?.message?.content || ""

    if (!content || content.trim() === "") {
      console.error("Empty response from OpenAI API")
      throw new Error("La respuesta de la API está vacía")
    }

    return content
  } catch (error: any) {
    console.error("Error al generar materiales adicionales:", error)

    // Log more detailed error information
    if (error.response) {
      console.error("OpenAI API error response:", {
        status: error.response.status,
        data: error.response.data,
      })
    }

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
 * Generate a presentation structure for a course
 */
export async function generatePresentation(courseData: CourseData): Promise<Presentation> {
  validateApiKey()

  try {
    if (!courseData || !courseData.title) {
      throw new Error("Datos del curso incompletos o inválidos")
    }

    console.log("Generating presentation for course:", courseData.title)

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

    console.log("Sending request to OpenAI API...")
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un experto en diseño de presentaciones educativas. 
          Tu tarea es crear una estructura de presentación concisa y efectiva para un curso.
          Debes proporcionar exactamente 6 slides, con títulos claros y puntos clave concisos.
          Cada punto debe ser una frase completa pero breve, fácil de leer en una presentación.
          El formato debe ser JSON válido y seguir exactamente la estructura especificada.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    console.log("OpenAI API response received")
    const content = response.choices[0]?.message?.content || ""
    console.log("Response content:", content.substring(0, 100) + "...")

    try {
      const presentation = JSON.parse(content) as Presentation

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
      console.error("Raw content:", content)
      throw new Error("Error processing API response")
    }
  } catch (error: any) {
    console.error("Error generating presentation:", error)

    // Log more detailed error information
    if (error.response) {
      console.error("OpenAI API error response:", {
        status: error.response.status,
        data: error.response.data,
      })
    }

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

/**
 * Generate a PDF for a course
 */
export async function generatePDF(courseData: CourseData): Promise<Blob> {
  try {
    if (!courseData || !courseData.title) {
      throw new Error("Datos del curso incompletos o inválidos")
    }

    // Import jsPDF and jspdf-autotable dynamically
    const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.default
    const autoTableModule = await import("jspdf-autotable")
    const autoTable = autoTableModule.default

    // Create a new PDF document
    const doc = new jsPDF()

    // Course title and date
    doc.setFontSize(24)
    doc.setTextColor(0, 51, 153) // Blue color
    doc.text(courseData.title, 105, 20, { align: "center" })

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado el ${new Date().toLocaleDateString()}`, 105, 28, { align: "center" })

    // Cover - General information
    doc.setFontSize(14)
    doc.setTextColor(0, 51, 153)
    doc.text("Información General del Curso", 14, 40)

    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)

    const generalInfo = [
      ["Público objetivo", courseData.audience || "No especificado"],
      ["Modalidad", courseData.modality || "No especificado"],
      ["Duración", courseData.duration || "No especificada"],
      ["Certificado", courseData.certificate ? "Sí" : "No"],
      ["Problema que resuelve", courseData.problem || "No especificado"],
      ["Propósito", courseData.purpose || "No especificado"],
      ["Experiencia previa", courseData.experience || "No especificado"],
    ]

    autoTable(doc, {
      startY: 45,
      head: [["Campo", "Detalle"]],
      body: generalInfo,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: "auto" },
      },
    })

    // Course structure
    doc.setFontSize(14)
    doc.setTextColor(0, 51, 153)
    doc.text("Estructura del Curso", 14, doc.lastAutoTable.finalY + 15)

    // Process structure to display correctly
    let structureLines: string[] = []
    if (courseData.structure) {
      structureLines = courseData.structure
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    } else {
      structureLines = [
        "1. Introducción al tema",
        "2. Desarrollo de conceptos clave",
        "3. Aplicación práctica",
        "4. Evaluación y cierre",
      ]
    }

    // Add description for each module
    const structureData = structureLines.map((line, index) => {
      // Extract module title (remove numbering if exists)
      const moduleTitle = line.replace(/^\d+[.)]\s*/, "").trim()

      // Generate a basic description for each module
      let description = ""
      if (index === 0) {
        description = `Presentación del curso, objetivos y conceptos fundamentales sobre ${courseData.title}.`
      } else if (index === structureLines.length - 1) {
        description = `Evaluación del aprendizaje, resumen de conceptos clave y próximos pasos.`
      } else {
        description = `Desarrollo de habilidades y conocimientos relacionados con ${moduleTitle}.`
      }

      return [line, description]
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Módulo", "Descripción"]],
      body: structureData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: "auto" },
      },
    })

    // Evaluation
    doc.setFontSize(14)
    doc.setTextColor(0, 51, 153)
    doc.text("Plan de Evaluación", 14, doc.lastAutoTable.finalY + 15)

    // Create a detailed evaluation plan based on provided data
    let evaluationPlan = ""

    if (courseData.evaluationMethod) {
      evaluationPlan += `${courseData.evaluationMethod}\n\n`
    }

    evaluationPlan += `Tipo de evaluación: ${courseData.evaluationType || "No especificado"}\n`
    evaluationPlan += `Certificación: ${courseData.certificate ? "Se otorgará certificado al finalizar el curso" : "No se otorgará certificado"}\n\n`

    // Add details based on evaluation type
    if (courseData.evaluationType === "manual") {
      evaluationPlan +=
        "La evaluación será realizada por el instructor, quien proporcionará retroalimentación personalizada a cada participante."
    } else if (courseData.evaluationType === "automatica") {
      evaluationPlan +=
        "La evaluación se realizará mediante cuestionarios automatizados y criterios predefinidos que permitirán medir el nivel de comprensión de los participantes."
    } else if (courseData.evaluationType === "mixta") {
      evaluationPlan +=
        "La evaluación combinará elementos automatizados (cuestionarios, ejercicios) con revisión personal del instructor para proporcionar una valoración integral del aprendizaje."
    }

    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    const splitEvaluation = doc.splitTextToSize(evaluationPlan, 180)
    doc.text(splitEvaluation, 14, doc.lastAutoTable.finalY + 25)

    // Calculate Y position after evaluation text
    const evaluationTextHeight = splitEvaluation.length * 5 // Approximately 5 units per line
    let currentY = doc.lastAutoTable.finalY + 25 + evaluationTextHeight + 15

    // Check if we need a new page
    if (currentY > 270) {
      doc.addPage()
      currentY = 20
    }

    // Materials
    doc.setFontSize(14)
    doc.setTextColor(0, 51, 153)
    doc.text("Materiales y Recursos", 14, currentY)
    currentY += 10

    // Process materials
    let materialsLines: string[] = []
    if (courseData.materials) {
      materialsLines = courseData.materials
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^[-•*]\s*/, "")) // Remove bullets
    } else {
      materialsLines = [
        "Presentaciones digitales",
        "Documentos de apoyo en PDF",
        "Ejercicios prácticos",
        "Material audiovisual",
      ]
    }

    // Add category for each material
    const materialsData = materialsLines.map((material) => {
      let category = "Material didáctico"

      if (material.toLowerCase().includes("presentaci")) {
        category = "Presentación"
      } else if (material.toLowerCase().includes("pdf") || material.toLowerCase().includes("documento")) {
        category = "Documento"
      } else if (material.toLowerCase().includes("video") || material.toLowerCase().includes("audio")) {
        category = "Multimedia"
      } else if (material.toLowerCase().includes("ejercicio") || material.toLowerCase().includes("actividad")) {
        category = "Actividad"
      }

      return [material, category]
    })

    autoTable(doc, {
      startY: currentY,
      head: [["Material", "Categoría"]],
      body: materialsData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
    })

    // Additional materials if they exist
    if (courseData.additionalMaterials && courseData.additionalMaterialsContent) {
      currentY = doc.lastAutoTable.finalY + 15

      // Check if we need a new page
      if (currentY > 270) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(0, 51, 153)
      doc.text("Materiales Adicionales Recomendados", 14, currentY)

      // Process additional materials content
      const additionalContent = courseData.additionalMaterialsContent

      // Simplify format for PDF
      const cleanedContent = additionalContent
        .replace(/#{1,3}\s+/g, "") // Remove markdown headers
        .replace(/\*\*/g, "") // Remove bold
        .replace(/\[([^\]]+)\]$$([^)]+)$$/g, "$1: $2") // Convert markdown links to text

      const additionalLines = cleanedContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const additionalData = additionalLines.map((line) => [line])

      autoTable(doc, {
        startY: currentY + 5,
        body: additionalData,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2 },
      })
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generado con Whorkshop - Página ${i} de ${totalPages}`, 105, 290, { align: "center" })
      doc.text(`${courseData.title}`, 14, 290)
    }

    // Convert document to Blob
    const pdfBlob = doc.output("blob")
    return pdfBlob
  } catch (error) {
    console.error("Error generating PDF:", error)

    // Create an error PDF in case of failure
    try {
      const jsPDFModule = await import("jspdf")
      const jsPDF = jsPDFModule.default

      const doc = new jsPDF()
      doc.setFontSize(24)
      doc.setTextColor(255, 0, 0)
      doc.text("Error al generar el PDF", 105, 20, { align: "center" })

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text("Ha ocurrido un error al generar el PDF del curso.", 105, 40, { align: "center" })
      doc.text("Por favor, intente nuevamente o contacte al soporte técnico.", 105, 50, { align: "center" })

      return doc.output("blob")
    } catch (emergencyError) {
      console.error("Error generating emergency PDF:", emergencyError)
      throw new Error("Error generating PDF. Please try again.")
    }
  }
}
