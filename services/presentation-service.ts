"use server"

import type { CourseData } from "@/types/course"
import PptxGenJS from "pptxgenjs"

export interface Slide {
  title: string
  content: string[]
  notes?: string
}

export interface Presentation {
  title: string
  author: string
  date: string
  slides: Slide[]
}

export async function generatePresentation(courseData: CourseData): Promise<Presentation> {
  try {
    if (!courseData || !courseData.title) {
      throw new Error("Datos del curso incompletos o inválidos")
    }

    console.log("Generating presentation for course:", courseData.title)

    // Create a structured presentation based on course data
    const presentation: Presentation = {
      title: courseData.title,
      author: "Generado con Whorkshop",
      date: new Date().toLocaleDateString(),
      slides: [
        // Title slide
        {
          title: courseData.title,
          content: [
            "Curso generado con Whorkshop",
            courseData.audience ? `Dirigido a: ${courseData.audience}` : "Presentación del curso",
            courseData.duration ? `Duración: ${courseData.duration}` : "Presentación general",
          ],
        },
        // Problem and purpose slide
        {
          title: "Problema y Propósito",
          content: [
            courseData.problem ? `Problema: ${courseData.problem}` : "Identificación del problema",
            courseData.purpose ? `Propósito: ${courseData.purpose}` : "Propósito del curso",
            courseData.experience ? `Experiencia previa: ${courseData.experience}` : "Requisitos previos",
          ],
          notes: "Explicar detalladamente el problema que resuelve el curso y su propósito principal.",
        },
        // Course structure slide
        {
          title: "Estructura del Curso",
          content: courseData.structure
            ? courseData.structure
                .split("\n")
                .slice(0, 5)
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            : [
                "Módulo 1: Introducción",
                "Módulo 2: Conceptos fundamentales",
                "Módulo 3: Aplicación práctica",
                "Módulo 4: Evaluación y cierre",
              ],
          notes: "Presentar la estructura general del curso, destacando la progresión lógica entre módulos.",
        },
        // Methodology slide
        {
          title: "Metodología",
          content: [
            courseData.modality ? `Modalidad: ${courseData.modality}` : "Enfoque práctico y participativo",
            "Combinación de teoría y práctica",
            "Actividades de aplicación real",
            "Retroalimentación continua",
            "Aprendizaje colaborativo",
          ],
          notes: "Explicar la metodología didáctica y cómo se desarrollarán las sesiones.",
        },
        // Materials slide
        {
          title: "Materiales y Recursos",
          content: courseData.materials
            ? courseData.materials
                .split("\n")
                .slice(0, 5)
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            : [
                "Presentaciones digitales",
                "Guías de ejercicios",
                "Material audiovisual",
                "Lecturas complementarias",
                "Plantillas de trabajo",
              ],
          notes: "Detallar los materiales que se utilizarán durante el curso y cómo acceder a ellos.",
        },
        // Evaluation slide
        {
          title: "Evaluación y Cierre",
          content: [
            courseData.evaluationMethod ? courseData.evaluationMethod : "Evaluación continua del aprendizaje",
            courseData.evaluationType
              ? `Tipo de evaluación: ${courseData.evaluationType}`
              : "Evaluación mixta: teórica y práctica",
            courseData.certificate ? "Se otorgará certificado al finalizar" : "Reconocimiento de participación",
            "Proyecto final integrador",
            "Retroalimentación personalizada",
          ],
          notes: "Explicar el sistema de evaluación, criterios y entregables esperados.",
        },
      ],
    }

    return presentation
  } catch (error) {
    console.error("Error generating presentation structure:", error)
    throw error
  }
}

export async function generatePPTX(presentation: Presentation): Promise<Blob> {
  try {
    if (!presentation || !Array.isArray(presentation.slides) || presentation.slides.length === 0) {
      throw new Error("Datos de presentación inválidos")
    }

    console.log("Generating PPTX with PptxGenJS")

    // Create a new PptxGenJS instance
    const pptx = new PptxGenJS()

    // Configure presentation properties
    pptx.author = presentation.author || "Whorkshop"
    pptx.title = presentation.title || "Presentación"
    pptx.subject = "Curso generado con Whorkshop"
    pptx.company = "Whorkshop"

    // Define a basic theme with better readable colors
    pptx.defineLayout({ name: "LAYOUT_16x9", width: 10, height: 5.625 })

    pptx.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "FFFFFF" },
      objects: [
        {
          line: {
            x: 0.0,
            y: 5.2,
            w: "100%",
            h: 0,
            line: {
              color: "0088CC",
              width: 1,
            },
          },
        },
      ],
      slideNumber: { x: 0.3, y: 5.3, color: "9F9F9F", fontFace: "Arial", fontSize: 10 },
    })

    // Create title slide
    const titleSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

    // Add title with better text handling
    titleSlide.addText(presentation.title || "Presentación", {
      x: 0.5,
      y: 1.5,
      w: 9.0,
      h: 1.5,
      fontSize: 36,
      color: "0088CC",
      bold: true,
      align: "center",
      valign: "middle",
      fontFace: "Arial",
      fit: "shrink",
      breakLine: true,
    })

    // Add author with better positioning
    titleSlide.addText(presentation.author || "Whorkshop", {
      x: 0.5,
      y: 3.3,
      w: 9.0,
      h: 0.5,
      fontSize: 18,
      color: "666666",
      align: "center",
      fontFace: "Arial",
    })

    // Add date with better positioning
    titleSlide.addText(presentation.date || new Date().toLocaleDateString(), {
      x: 0.5,
      y: 4.0,
      w: 9.0,
      h: 0.5,
      fontSize: 14,
      color: "666666",
      align: "center",
      fontFace: "Arial",
    })

    // Create content slides
    for (let i = 1; i < presentation.slides.length; i++) {
      const slideData = presentation.slides[i]
      if (!slideData) continue

      // Function to truncate content if needed
      const truncateContent = (text: string, maxLength = 80): string => {
        return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text
      }

      const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

      // Add title with automatic resizing
      slide.addText(slideData.title || `Slide ${i + 1}`, {
        x: 0.5,
        y: 0.5,
        w: 9.0,
        h: 0.8,
        fontSize: 24,
        color: "0088CC",
        bold: true,
        fontFace: "Arial",
        fit: "shrink",
        breakLine: true,
      })

      // Add content (bullets) with overflow handling
      if (Array.isArray(slideData.content) && slideData.content.length > 0) {
        // Check if we need to split content into multiple slides (if more than 5 items or items are too long)
        const needsSplit =
          slideData.content.length > 5 || slideData.content.some((point) => point && point.length > 100)

        if (needsSplit && slideData.content.length > 5) {
          // Handle by creating multiple slides
          const contentChunks = chunkArray(slideData.content, 5)

          // First chunk goes on the current slide
          const firstChunkPoints = contentChunks[0].map((point) => ({
            text: point || "Punto sin contenido",
            options: { breakLine: true, fit: "shrink" },
          }))

          slide.addText(firstChunkPoints, {
            x: 0.5,
            y: 1.5,
            w: 9.0,
            h: 3.2,
            fontSize: 18,
            color: "333333",
            bullet: { type: "bullet" },
            breakLine: true,
            fontFace: "Arial",
          })

          // Additional chunks go on new slides
          for (let j = 1; j < contentChunks.length; j++) {
            const extraSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

            // Add continuation title
            extraSlide.addText(`${slideData.title || `Slide ${i + 1}`} (continuación)`, {
              x: 0.5,
              y: 0.5,
              w: 9.0,
              h: 0.8,
              fontSize: 24,
              color: "0088CC",
              bold: true,
              fontFace: "Arial",
              fit: "shrink",
            })

            // Add content for this chunk
            const chunkPoints = contentChunks[j].map((point) => ({
              text: point || "Punto sin contenido",
              options: { breakLine: true, fit: "shrink" },
            }))

            extraSlide.addText(chunkPoints, {
              x: 0.5,
              y: 1.5,
              w: 9.0,
              h: 3.2,
              fontSize: 18,
              color: "333333",
              bullet: { type: "bullet" },
              breakLine: true,
              fontFace: "Arial",
            })

            // Add notes if they exist
            if (slideData.notes) {
              extraSlide.addNotes(`${slideData.notes} (continuación)`)
            }
          }
        } else {
          // For content that doesn't need to be split across slides,
          // just truncate and fit on one slide
          const bulletPoints = slideData.content.map((point) => ({
            text: truncateContent(point || "Punto sin contenido", 100),
            options: { breakLine: true, fit: "shrink" },
          }))

          slide.addText(bulletPoints, {
            x: 0.5,
            y: 1.5,
            w: 9.0,
            h: 3.2,
            fontSize: 18,
            color: "333333",
            bullet: { type: "bullet" },
            breakLine: true,
            fontFace: "Arial",
          })
        }
      } else {
        // If there's no content, add a default message
        slide.addText(
          [
            { text: "Contenido no disponible" },
            { text: "Esta diapositiva no tiene puntos definidos" },
            { text: "Contacte al soporte técnico si ve este mensaje" },
          ],
          {
            x: 0.5,
            y: 1.5,
            w: 9.0,
            h: 3.2,
            fontSize: 18,
            color: "333333",
            bullet: { type: "bullet" },
            fontFace: "Arial",
          },
        )
      }

      // Add notes if they exist
      if (slideData.notes) {
        slide.addNotes(slideData.notes)
      }
    }

    console.log("PPTX generation complete, writing file...")
    // Generate and return the file as Blob
    return (await pptx.writeFile({ outputType: "blob" })) as Blob
  } catch (error) {
    console.error("Error generating PPTX:", error)

    // Create an emergency presentation in case of error
    try {
      console.log("Generating emergency PPTX...")
      const pptx = new PptxGenJS()
      pptx.title = "Error en la generación"

      const slide = pptx.addSlide()
      slide.addText("Error al generar la presentación", {
        x: 0.5,
        y: 2.0,
        w: 9.0,
        h: 1.0,
        fontSize: 24,
        color: "FF0000",
        bold: true,
        align: "center",
        fontFace: "Arial",
      })

      slide.addText(
        [
          { text: "Ha ocurrido un error al generar la presentación" },
          { text: "Por favor, intente nuevamente" },
          { text: "Si el problema persiste, contacte al soporte técnico" },
        ],
        {
          x: 0.5,
          y: 3.0,
          w: 9.0,
          h: 2.0,
          fontSize: 18,
          color: "333333",
          bullet: { type: "bullet" },
          align: "center",
          fontFace: "Arial",
        },
      )

      return (await pptx.writeFile({ outputType: "blob" })) as Blob
    } catch (emergencyError) {
      console.error("Error generating emergency PPTX:", emergencyError)
      throw new Error("No se pudo generar el archivo PPTX")
    }
  }
}

// Helper function to split arrays into chunks
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

