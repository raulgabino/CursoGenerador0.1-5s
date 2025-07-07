"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import type { CourseData } from "@/types/course"
import { FileText, Loader2 } from "lucide-react"

interface FinalScreenProps {
  courseData: CourseData
  onReset: () => void
}

export default function FinalScreen({ courseData, onReset }: FinalScreenProps) {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownloadPDF = async () => {
    if (!courseData || !courseData.title) {
      setError("Datos del curso incompletos. No se puede generar el PDF.")
      return
    }

    setIsDownloadingPDF(true)
    setError(null)

    try {
      // Asumimos que generatePDF está en lib/pdf-generator.ts
      // y que funciona correctamente del lado del cliente.
      const { generatePDF } = await import("@/lib/pdf-generator")
      const pdfBlob = await generatePDF(courseData)
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${courseData.title.replace(/\s+/g, "_")}_curso.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      setError(`Hubo un error al descargar el PDF: ${error.message}.`)
    } finally {
      setIsDownloadingPDF(false)
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
        <h2 className="text-2xl font-bold text-blue-800 mb-2">¡Curso generado con éxito!</h2>
        <p className="text-gray-600">Tu curso "{courseData?.title || "sin título"}" está listo para ser descargado.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <div className="bg-white border rounded-lg p-6 mb-8 max-w-md mx-auto shadow-md">
        <h3 className="font-bold text-lg text-blue-700 mb-4">Opciones de descarga</h3>
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
              Descargar Plan de Curso en PDF
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-gray-600 mb-4">¿Quieres crear otro curso?</p>
        <Button onClick={onReset} variant="outline">
          Crear Nuevo Curso
        </Button>
      </div>
    </motion.div>
  )
}
