"use server"

import type { CourseData } from "@/types/course"
import PptxGenJS from "pptxgenjs"
import { generatePresentation as generatePresentationAction } from "@/app/actions/openai-actions"

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
  console.log("Presentation service: Calling generatePresentationAction")
  try {
    return await generatePresentationAction(courseData)
  } catch (error) {
    console.error("Presentation service: Error in generatePresentation:", error)
    throw error // Re-throw to allow proper error handling in UI
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

    // Define a basic theme
    pptx.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "FFFFFF" },
      objects: [{ line: { x: 0.0, y: 5.45, w: "100%", h: 0, line: { color: "0088CC", width: 1 } } }],
      slideNumber: { x: 0.3, y: 6.9, color: "9F9F9F" },
    })

    // Create title slide
    const titleSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" })
    titleSlide.addText(presentation.title || "Presentación", {
      x: 0.5,
      y: 1.5,
      w: "90%",
      h: 1.5,
      fontSize: 36,
      color: "0088CC",
      bold: true,
      align: "center",
    })

    titleSlide.addText(presentation.author || "Whorkshop", {
      x: 0.5,
      y: 3.3,
      w: "90%",
      h: 0.5,
      fontSize: 18,
      color: "9F9F9F",
      align: "center",
    })

    titleSlide.addText(presentation.date || new Date().toLocaleDateString(), {
      x: 0.5,
      y: 4.0,
      w: "90%",
      h: 0.5,
      fontSize: 14,
      color: "9F9F9F",
      align: "center",
    })

    // Create content slides
    for (let i = 1; i < presentation.slides.length; i++) {
      const slideData = presentation.slides[i]
      if (!slideData) continue

      const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

      // Add title
      slide.addText(slideData.title || `Slide ${i + 1}`, {
        x: 0.5,
        y: 0.5,
        w: "90%",
        h: 0.8,
        fontSize: 24,
        color: "0088CC",
        bold: true,
      })

      // Add content (bullets)
      if (Array.isArray(slideData.content) && slideData.content.length > 0) {
        const bulletPoints = slideData.content.map((point) => ({ text: point || "Punto sin contenido" }))

        slide.addText(bulletPoints, {
          x: 0.5,
          y: 1.5,
          w: "90%",
          h: 4.0,
          fontSize: 18,
          color: "333333",
          bullet: { type: "bullet" },
        })
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
            w: "90%",
            h: 4.0,
            fontSize: 18,
            color: "333333",
            bullet: { type: "bullet" },
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
        w: "90%",
        h: 1.0,
        fontSize: 24,
        color: "FF0000",
        bold: true,
        align: "center",
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
          w: "90%",
          h: 2.0,
          fontSize: 18,
          color: "333333",
          bullet: { type: "bullet" },
          align: "center",
        },
      )

      return (await pptx.writeFile({ outputType: "blob" })) as Blob
    } catch (emergencyError) {
      console.error("Error generating emergency PPTX:", emergencyError)
      throw new Error("No se pudo generar el archivo PPTX")
    }
  }
}
