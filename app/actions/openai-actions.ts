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
    Genera una lista completa de materiales adicionales recomendados para un curso titulado "${courseData.title}" 
    dirigido a "${courseData.audience || "estudiantes"}".
    
    Información del curso:
    - Problema que resuelve: "${courseData.problem || "No especificado"}"
    - Propósito: "${courseData.purpose || "No especificado"}"
    - Estructura: "${courseData.structure || "No especificada"}"
    - Evaluación: "${courseData.evaluationMethod || "No especificada"}"
    
    Proporciona una lista detallada que incluya:
    1. Bibliografía recomendada (3-5 libros con autores y títulos reales)
    2. Recursos digitales verificados (sitios web, plataformas de aprendizaje)
    3. Contenido audiovisual relevante (canales de YouTube, podcasts, etc.)
    4. Herramientas y software útiles para el aprendizaje
    5. Materiales específicos para cada módulo principal
    
    Cada recurso debe ser:
    - Real y verificable (con títulos y autores reales para libros)
    - Relevante y específico para el tema del curso
    - Accesible para la audiencia objetivo
    - Actualizado y de alta calidad
    
    Formatea la respuesta en Markdown, organizando los recursos por categorías claras.
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en diseño instruccional y educación. Tu tarea es recomendar materiales adicionales de alta calidad, específicos y verificables para complementar un curso.",
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
      return generarContenidoFallback(courseData)
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

    // Provide improved fallback content without error messages
    return generarContenidoFallback(courseData)
  }
}

// Helper function to generate fallback content based on course data
function generarContenidoFallback(courseData: CourseData): string {
  const titulo = courseData.title || "este tema"
  const audiencia = courseData.audience || "estudiantes"

  // Extract keywords from course data for more relevant suggestions
  const keywords = [
    courseData.title || "",
    courseData.problem || "",
    courseData.purpose || "",
    courseData.audience || "",
  ]
    .join(" ")
    .toLowerCase()

  // Determine the general field based on keywords
  let campo = "pedagogía"
  if (keywords.match(/program|código|software|web|app|computadora|informática|desarrollo/)) {
    campo = "programación"
  } else if (keywords.match(/market|venta|cliente|negocio|emprendimiento|empresa/)) {
    campo = "marketing"
  } else if (keywords.match(/diseño|arte|creatividad|visual|gráfico/)) {
    campo = "diseño"
  } else if (keywords.match(/salud|medicina|enfermería|cuidado|bienestar/)) {
    campo = "salud"
  }

  // Generate specific resources based on identified field
  let libros, sitiosWeb, videos, herramientas

  switch (campo) {
    case "programación":
      libros = [
        '"Clean Code" por Robert C. Martin',
        '"JavaScript: The Good Parts" por Douglas Crockford',
        '"Learning Python" por Mark Lutz',
        '"Designing Data-Intensive Applications" por Martin Kleppmann',
      ]
      sitiosWeb = [
        "MDN Web Docs: documentación completa sobre desarrollo web",
        "freeCodeCamp: cursos gratuitos de programación",
        "Stack Overflow: comunidad de preguntas y respuestas para programadores",
        "GitHub Learning Lab: proyectos prácticos para aprender programación",
      ]
      videos = [
        'Canal de YouTube "Traversy Media": tutoriales de desarrollo web',
        'Canal de YouTube "The Net Ninja": tutoriales detallados sobre diferentes tecnologías',
        'Podcast "Syntax": discusiones sobre desarrollo web moderno',
      ]
      herramientas = [
        "Visual Studio Code: editor de código con extensiones para múltiples lenguajes",
        "GitHub: plataforma de control de versiones y colaboración",
        "CodePen: entorno para experimentar con código frontend",
        "replit: IDE en línea para practicar programación",
      ]
      break

    case "marketing":
      libros = [
        '"Marketing 4.0" por Philip Kotler',
        '"This Is Marketing" por Seth Godin',
        '"Building a StoryBrand" por Donald Miller',
        '"Contagious: How to Build Word of Mouth in the Digital Age" por Jonah Berger',
      ]
      sitiosWeb = [
        "HubSpot Academy: cursos gratuitos de marketing digital",
        "Neil Patel Blog: recursos y guías de marketing digital",
        "Think with Google: tendencias y estudios de marketing",
        "Social Media Examiner: guías y tutoriales de marketing en redes sociales",
      ]
      videos = [
        'Canal de YouTube "Marketing Digital 360": estrategias de marketing en español',
        'Podcast "Marketing School" con Neil Patel y Eric Siu',
        "Webinars de HubSpot sobre estrategias de marketing",
      ]
      herramientas = [
        "Google Analytics: análisis de tráfico web",
        "Mailchimp: plataforma de email marketing",
        "Canva: diseño gráfico para redes sociales",
        "SEMrush: herramienta de SEO y análisis de competencia",
      ]
      break

    case "diseño":
      libros = [
        '"Don\'t Make Me Think" por Steve Krug',
        '"The Design of Everyday Things" por Don Norman',
        '"Thinking with Type" por Ellen Lupton',
        '"Logo Design Love" por David Airey',
      ]
      sitiosWeb = [
        "Behance: plataforma de portafolios creativos",
        "Dribbble: comunidad de diseñadores",
        "Smashing Magazine: artículos sobre diseño web",
        "UI Patterns: biblioteca de patrones de diseño de interfaz",
      ]
      videos = [
        'Canal de YouTube "The Futur": contenido sobre diseño y negocios creativos',
        'Canal de YouTube "CharliMarieTV": consejos para diseñadores web',
        'Podcast "Design Matters" con Debbie Millman',
      ]
      herramientas = [
        "Adobe Creative Cloud: suite de aplicaciones de diseño",
        "Figma: herramienta de diseño colaborativo",
        "Sketch: aplicación de diseño de interfaces",
        "InVision: plataforma de prototipado y colaboración",
      ]
      break

    case "salud":
      libros = [
        '"Being Mortal" por Atul Gawande',
        '"The Body: A Guide for Occupants" por Bill Bryson',
        '"How Doctors Think" por Jerome Groopman',
        '"Why We Sleep" por Matthew Walker',
      ]
      sitiosWeb = [
        "Mayo Clinic: información médica verificada",
        "Medscape: recursos para profesionales de la salud",
        "Khan Academy Medicine: contenido educativo sobre medicina",
        "BMJ Learning: plataforma de aprendizaje médico",
      ]
      videos = [
        'Canal de YouTube "Osmosis": videos educativos sobre medicina',
        'Canal de YouTube "Ninja Nerd": explicaciones detalladas de anatomía y fisiología',
        'Podcast "Science Vs": análisis científico de temas de salud',
      ]
      herramientas = [
        "Complete Anatomy: aplicación 3D de anatomía",
        "Epocrates: base de datos de medicamentos",
        "Virtual Patient Simulator: simulaciones clínicas",
        "PubMed: base de datos de literatura científica",
      ]
      break

    default:
      libros = [
        '"Aprendizaje Visible" por John Hattie',
        '"Maestría" por Robert Greene',
        '"Mindset: La actitud del éxito" por Carol S. Dweck',
        '"El elemento" por Ken Robinson',
      ]
      sitiosWeb = [
        "Coursera: cursos en línea de universidades reconocidas",
        "Khan Academy: plataforma gratuita de aprendizaje",
        "TED Talks: charlas inspiradoras sobre diversos temas",
        "ERIC: base de datos de investigación educativa",
      ]
      videos = [
        'Canal de YouTube "CrashCourse": videos educativos sobre diversos temas',
        'Canal de YouTube "TED-Ed": lecciones animadas',
        'Podcast "Teaching in Higher Ed": estrategias de enseñanza',
      ]
      herramientas = [
        "Google Classroom: plataforma para gestionar cursos",
        "Miro: pizarra digital colaborativa",
        "Kahoot: plataforma para crear cuestionarios interactivos",
        "Padlet: muro virtual colaborativo",
      ]
  }

  return `
## Bibliografía recomendada
- ${libros[0]}
- ${libros[1]}
- ${libros[2]}
- ${libros[3]}

## Recursos en línea
- ${sitiosWeb[0]}
- ${sitiosWeb[1]}
- ${sitiosWeb[2]}
- ${sitiosWeb[3]}

## Contenido audiovisual
- ${videos[0]}
- ${videos[1]}
- ${videos[2]}

## Herramientas
- ${herramientas[0]}
- ${herramientas[1]}
- ${herramientas[2]}
- ${herramientas[3]}

## Materiales específicos por módulo
- Para la introducción: guías de conceptos básicos y estudios de caso introductorios
- Para módulos teóricos: lecturas seleccionadas y videos explicativos
- Para módulos prácticos: plantillas de trabajo, ejercicios guiados y problemas para resolver
- Para la evaluación: rúbricas detalladas, ejemplos de proyectos exitosos y guías de retroalimentación
`
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

    // Create a new PDF document with better default settings
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    })

    // Define consistent margins for better readability
    const margin = {
      left: 15,
      right: 15,
      top: 15,
      bottom: 20,
    }

    // Define consistent spacing
    const spacing = {
      afterTitle: 8,
      afterSection: 15,
      afterTable: 20,
      betweenElements: 10,
    }

    // Define page dimensions for content calculations
    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const contentWidth = pageWidth - margin.left - margin.right

    // Function to check if we need a page break
    const needsPageBreak = (currentY: number, requiredSpace: number) => {
      return currentY + requiredSpace > pageHeight - margin.bottom
    }

    // Function to truncate text if too long
    const truncateText = (text: string, maxLength: number): string => {
      if (!text) return ""
      return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text
    }

    // Function to add a section title with consistent styling
    const addSectionTitle = (title: string, y: number): number => {
      doc.setFontSize(14)
      doc.setTextColor(0, 51, 153) // Blue color
      doc.setFont("helvetica", "bold")
      doc.text(title, margin.left, y)
      return y + spacing.afterTitle
    }

    // Course title and date - Cover page
    let currentY = margin.top

    // Add logo or header image if available
    // doc.addImage("logo.png", "PNG", margin.left, currentY, 40, 15);
    // currentY += 20;

    // Title with dynamic font sizing
    const titleMaxWidth = contentWidth
    let titleFontSize = 24
    doc.setFontSize(titleFontSize)
    doc.setTextColor(0, 51, 153) // Blue color
    doc.setFont("helvetica", "bold")

    // Check if title is too long and reduce font size if needed
    while (doc.getTextWidth(courseData.title) > titleMaxWidth && titleFontSize > 14) {
      titleFontSize -= 2
      doc.setFontSize(titleFontSize)
    }

    // Split long titles into multiple lines if needed
    const splitTitle = doc.splitTextToSize(courseData.title, titleMaxWidth)
    doc.text(splitTitle, pageWidth / 2, currentY, { align: "center" })

    // Update current Y position based on title height
    currentY += splitTitle.length * (titleFontSize * 0.35) + spacing.afterTitle

    // Add date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "normal")
    const dateText = `Generado el ${new Date().toLocaleDateString()}`
    doc.text(dateText, pageWidth / 2, currentY, { align: "center" })
    currentY += spacing.betweenElements * 2

    // General information section
    currentY = addSectionTitle("Información General del Curso", currentY)
    currentY += spacing.betweenElements / 2

    const generalInfo = [
      ["Público objetivo", courseData.audience || "No especificado"],
      ["Modalidad", courseData.modality || "No especificado"],
      ["Duración", courseData.duration || "No especificada"],
      ["Certificado", courseData.certificate ? "Sí" : "No"],
      ["Problema que resuelve", truncateText(courseData.problem || "No especificado", 300)],
      ["Propósito", truncateText(courseData.purpose || "No especificado", 300)],
      ["Experiencia previa", truncateText(courseData.experience || "No especificado", 300)],
    ]

    // Add general info table with improved styling
    autoTable(doc, {
      startY: currentY,
      head: [["Campo", "Detalle"]],
      body: generalInfo,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        overflow: "linebreak",
        font: "helvetica",
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: { cellWidth: contentWidth - 50 },
      },
      margin: { left: margin.left, right: margin.right },
      didDrawPage: (data) => {
        // Add header and footer on each page
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`${courseData.title}`, margin.left, pageHeight - 10)
        doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - margin.right, pageHeight - 10, { align: "right" })
      },
    })

    // Update current Y position after table
    currentY = doc.lastAutoTable.finalY + spacing.afterTable

    // Check if we need a page break before the structure section
    if (needsPageBreak(currentY, 50)) {
      doc.addPage()
      currentY = margin.top
    }

    // Course structure section
    currentY = addSectionTitle("Estructura del Curso", currentY)
    currentY += spacing.betweenElements / 2

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

      return [truncateText(line, 150), truncateText(description, 300)]
    })

    // Add structure table with improved styling
    autoTable(doc, {
      startY: currentY,
      head: [["Módulo", "Descripción"]],
      body: structureData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        overflow: "linebreak",
        font: "helvetica",
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: "bold" },
        1: { cellWidth: contentWidth - 80 },
      },
      margin: { left: margin.left, right: margin.right },
      didDrawPage: (data) => {
        // Add header and footer on each page
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`${courseData.title}`, margin.left, pageHeight - 10)
        doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - margin.right, pageHeight - 10, { align: "right" })
      },
    })

    // Update current Y position after table
    currentY = doc.lastAutoTable.finalY + spacing.afterTable

    // Check if we need a page break before the evaluation section
    if (needsPageBreak(currentY, 80)) {
      doc.addPage()
      currentY = margin.top
    }

    // Evaluation section
    currentY = addSectionTitle("Plan de Evaluación", currentY)
    currentY += spacing.betweenElements

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
    doc.setFont("helvetica", "normal")

    // Split evaluation text into multiple lines with proper line breaks
    const splitEvaluation = doc.splitTextToSize(evaluationPlan, contentWidth)
    doc.text(splitEvaluation, margin.left, currentY)

    // Calculate Y position after evaluation text
    const evaluationTextHeight = splitEvaluation.length * 5 // Approximately 5 units per line
    currentY += evaluationTextHeight + spacing.afterSection

    // Check if we need a page break before the materials section
    if (needsPageBreak(currentY, 100)) {
      doc.addPage()
      currentY = margin.top
    }

    // Materials section
    currentY = addSectionTitle("Materiales y Recursos", currentY)
    currentY += spacing.betweenElements

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

      return [truncateText(material, 150), category]
    })

    // Add materials table with improved styling
    autoTable(doc, {
      startY: currentY,
      head: [["Material", "Categoría"]],
      body: materialsData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        overflow: "linebreak",
        font: "helvetica",
      },
      margin: { left: margin.left, right: margin.right },
      didDrawPage: (data) => {
        // Add header and footer on each page
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`${courseData.title}`, margin.left, pageHeight - 10)
        doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - margin.right, pageHeight - 10, { align: "right" })
      },
    })

    // Update current Y position after table
    currentY = doc.lastAutoTable.finalY + spacing.afterTable

    // Additional materials if they exist
    if (courseData.additionalMaterials && courseData.additionalMaterialsContent) {
      // Check if we need a page break before additional materials
      if (needsPageBreak(currentY, 100)) {
        doc.addPage()
        currentY = margin.top
      }

      currentY = addSectionTitle("Materiales Adicionales Recomendados", currentY)
      currentY += spacing.betweenElements

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

      // Group lines by section for better organization
      const groupedLines: string[][] = []
      let currentGroup: string[] = []

      additionalLines.forEach((line) => {
        if (line.startsWith("- ") || line.startsWith("* ")) {
          // This is a list item, add to current group
          currentGroup.push(line)
        } else if (line.length > 0) {
          // This might be a section header, start a new group
          if (currentGroup.length > 0) {
            groupedLines.push([...currentGroup])
            currentGroup = []
          }
          currentGroup.push(line)
        }
      })

      // Add the last group if not empty
      if (currentGroup.length > 0) {
        groupedLines.push(currentGroup)
      }

      // Create tables for each group with better styling
      for (const group of groupedLines) {
        // Check if we need a page break
        if (needsPageBreak(currentY, 50)) {
          doc.addPage()
          currentY = margin.top
        }

        // Add section header if first line looks like a header
        if (group[0] && !group[0].startsWith("- ") && !group[0].startsWith("* ")) {
          doc.setFontSize(12)
          doc.setTextColor(0, 51, 153)
          doc.setFont("helvetica", "bold")
          doc.text(group[0], margin.left, currentY)
          currentY += spacing.betweenElements

          // Skip the header in the table data
          const tableData = group.slice(1).map((line) => [line.replace(/^[-*]\s+/, "")])

          if (tableData.length > 0) {
            autoTable(doc, {
              startY: currentY,
              body: tableData,
              theme: "plain",
              styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: "linebreak",
                font: "helvetica",
              },
              margin: { left: margin.left + 5, right: margin.right },
            })

            currentY = doc.lastAutoTable.finalY + spacing.betweenElements
          }
        } else {
          // All items are list items, just create a table
          const tableData = group.map((line) => [line.replace(/^[-*]\s+/, "")])

          autoTable(doc, {
            startY: currentY,
            body: tableData,
            theme: "plain",
            styles: {
              fontSize: 9,
              cellPadding: 3,
              overflow: "linebreak",
              font: "helvetica",
            },
            margin: { left: margin.left, right: margin.right },
          })

          currentY = doc.lastAutoTable.finalY + spacing.betweenElements
        }
      }
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generado con Whorkshop - Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      })
      doc.text(`${courseData.title}`, margin.left, pageHeight - 10)
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

/**
 * Generate a preview PDF for a course
 */
export async function generatePDFPreview(courseData: CourseData): Promise<string> {
  try {
    const pdfBlob = await generatePDF(courseData)
    return URL.createObjectURL(pdfBlob)
  } catch (error) {
    console.error("Error generating PDF preview:", error)
    throw error
  }
}

