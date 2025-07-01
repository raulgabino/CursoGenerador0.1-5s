"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Download, X, Loader2 } from "lucide-react"
import type { Presentation } from "@/services/presentation-service"

interface PresentationViewerProps {
  presentation: Presentation
  onClose: () => void
  onDownload: () => void
  isDownloadingPPTX?: boolean
}

export default function PresentationViewer({
  presentation,
  onClose,
  onDownload,
  isDownloadingPPTX = false,
}: PresentationViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const totalSlides = presentation?.slides?.length || 0

  const goToNextSlide = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  // Verificar que la presentación y sus slides son válidos
  if (!presentation || !Array.isArray(presentation.slides) || presentation.slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error en la presentación</h2>
          <p className="text-gray-700 mb-6">No se pudo cargar la presentación correctamente.</p>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    )
  }

  const currentSlide = presentation.slides[currentSlideIndex] || {
    title: "Slide no disponible",
    content: ["Error al cargar el contenido de esta diapositiva"],
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Vista previa de la presentación</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onDownload} disabled={isDownloadingPPTX}>
              {isDownloadingPPTX ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PPTX
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <Card className="aspect-video bg-white shadow-md mx-auto max-w-3xl">
            <CardContent className="p-8 h-full flex flex-col">
              {currentSlideIndex === 0 ? (
                // Slide de título
                <div className="flex flex-col items-center justify-center text-center h-full">
                  <h1 className="text-4xl font-bold text-blue-600 mb-6">{currentSlide.title}</h1>
                  <p className="text-xl text-gray-600 mb-2">{presentation.author}</p>
                  <p className="text-lg text-gray-500">{presentation.date}</p>
                </div>
              ) : (
                // Slides de contenido
                <div className="h-full flex flex-col">
                  <h2 className="text-2xl font-bold text-blue-600 mb-6 pb-2 border-b border-gray-200">
                    {currentSlide.title}
                  </h2>
                  <ul className="list-disc pl-6 space-y-4 text-lg flex-1">
                    {currentSlide.content.map((point, index) => (
                      <li key={index} className="text-gray-700">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {currentSlide.notes && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">Notas para el presentador:</h3>
            <p className="text-sm text-yellow-700">{currentSlide.notes}</p>
          </div>
        )}

        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-sm text-gray-500">
            Slide {currentSlideIndex + 1} de {totalSlides}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={goToPrevSlide} disabled={currentSlideIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextSlide}
              disabled={currentSlideIndex === totalSlides - 1}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

