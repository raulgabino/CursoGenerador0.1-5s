"use client"

import type { CourseData } from "@/types/course"

/**
 * Generate a PDF for a course (client-side only)
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
