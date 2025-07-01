"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import type { CourseData } from "@/types/course"
import { generatePDF } from "@/services/openai-service"
import { generatePresentation, generatePPTX } from "@/services/presentation-service"
import PresentationViewer from "@/components/presentation-viewer"
import { FileText, PresentationIcon, Loader2 } from "lucide-react"

interface FinalScreenProps {
  courseData: CourseData
  onReset: () => void
}

export default function FinalScreen({ courseData, onReset }: FinalScreenProps) {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false)
  const [presentation, setPresentation] = useState<any>(null)
  const [showPresentationViewer, setShowPresentationViewer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloadingPPTX, setIsDownloadingPPTX] = useState(false)

  const handleDownloadPDF = async () => {
    if (!courseData || !courseData.title) {
      setError("Datos del curso incompletos. No se puede generar el PDF.")
      return
    }

    setIsDownloadingPDF(true)
    setError(null)

    try {
      console.log("Generating PDF for course:", courseData.title)
      // Generate PDF
      const pdfBlob = await generatePDF(courseData)
      console.log("PDF generated successfully")

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob)

      // Create an <a> element to download the PDF
      const link = document.createElement("a")
      link.href = url
      link.download = `${courseData.title.replace(/\s+/g, "_")}_curso.pdf`
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error("Error downloading PDF:", error)
      setError(
        `Hubo un error al descargar el PDF: ${error.message || "Error desconocido"}. Por favor, inténtalo de nuevo.`,
      )
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  const handleGeneratePresentation = async () => {
    if (!courseData || !courseData.title) {
      setError("Datos del curso incompletos. No se puede generar la presentación.")
      return
    }

    setIsGeneratingPresentation(true)
    setError(null)

    try {
      console.log("Generating presentation for course:", courseData.title)
      // Generate presentation
      const presentationData = await generatePresentation(courseData)
      console.log("Presentation generated successfully")
      setPresentation(presentationData)
      setShowPresentationViewer(true)
    } catch (error: any) {
      console.error("Error generating presentation:", error)
      setError(
        `Hubo un error al generar la presentación: ${error.message || "Error desconocido"}. Por favor, inténtalo de nuevo.`,
      )
    } finally {
      setIsGeneratingPresentation(false)
    }
  }

  const handleDownloadPresentation = async () => {
    if (!presentation) {
      // If no presentation exists, generate one first
      try {
        setIsDownloadingPPTX(true)
        setError(null)

        console.log("Generating presentation for download...")
        const presentationData = await generatePresentation(courseData)
        setPresentation(presentationData)

        // Now generate and download the PPTX
        console.log("Generating PPTX file...")
        const pptxBlob = await generatePPTX(presentationData)

        // Create a URL for the blob
        const url = URL.createObjectURL(pptxBlob)

        // Create an <a> element to download the PPTX
        const link = document.createElement("a")
        link.href = url
        link.download = `${courseData.title.replace(/\s+/g, "_")}_presentacion.pptx`
        document.body.appendChild(link)
        link.click()

        // Clean up
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error: any) {
        console.error("Error generating and downloading presentation:", error)
        setError(`Error: ${error.message || "No se pudo generar la presentación"}`)
      } finally {
        setIsDownloadingPPTX(false)
      }
      return
    }

    setIsDownloadingPPTX(true)
    setError(null)

    try {
      console.log("Generating PPTX file...")
      // Generate PPTX file
      const pptxBlob = await generatePPTX(presentation)
      console.log("PPTX generated successfully")

      // Create a URL for the blob
      const url = URL.createObjectURL(pptxBlob)

      // Create an <a> element to download the PPTX
      const link = document.createElement("a")
      link.href = url
      link.download = `${courseData.title.replace(/\s+/g, "_")}_presentacion.pptx`
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error("Error downloading PPTX:", error)
      setError(
        `Hubo un error al descargar la presentación: ${error.message || "Error desconocido"}. Por favor, inténtalo de nuevo.`,
      )
    } finally {
      setIsDownloadingPPTX(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-8"
    >
      <div className="mb-8">
        <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-blue-800 mb-2">¡Curso generado con éxito!</h2>
        <p className="text-gray-600">Tu curso "{courseData.title}" está listo para ser descargado y utilizado.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <div className="bg-white border rounded-lg p-6 mb-8 max-w-md mx-auto shadow-md">
        <h3 className="font-bold text-lg text-blue-700 mb-4">Opciones de descarga</h3>

        <div className="space-y-4">
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isDownloadingPDF ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Descargando PDF...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Descargar PDF
              </>
            )}
          </Button>

          <Button
            onClick={handleGeneratePresentation}
            disabled={isGeneratingPresentation}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGeneratingPresentation ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generando presentación...
              </>
            ) : (
              <>
                <PresentationIcon className="h-5 w-5 mr-2" />
                Generar presentación
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>La presentación generada tendrá 6 slides con los puntos clave de tu curso.</p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-gray-600 mb-4">¿Quieres crear otro curso?</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onReset} variant="outline">
            Crear nuevo curso
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="secondary">
            Volver al inicio
          </Button>
        </div>
      </div>

      {showPresentationViewer && presentation && (
        <PresentationViewer
          presentation={presentation}
          onClose={() => setShowPresentationViewer(false)}
          onDownload={handleDownloadPresentation}
          isDownloadingPPTX={isDownloadingPPTX}
        />
      )}
    </motion.div>
  )
}

