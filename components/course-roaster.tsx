"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import Image from "next/image"
import type { CourseData } from "@/types/course"
import { generateCourseRoast } from "@/app/actions/grok-actions"

interface CourseRoasterProps {
  courseData: CourseData
}

// Predefined loading messages
const LOADING_MESSAGES = [
  "Analizando este intento de curso...",
  "Procesando esta obra maestra educativa...",
  "Calibrando mi sarcasmo para este curso...",
  "Comparando con los estándares de SpaceX...",
  "Preparando comentarios constructivamente destructivos...",
]

export default function CourseRoaster({ courseData }: CourseRoasterProps) {
  const [roast, setRoast] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const getRandomLoadingMessage = () => {
    const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length)
    return LOADING_MESSAGES[randomIndex]
  }

  const handleGenerateRoast = async () => {
    setIsLoading(true)
    setError(null)
    setLoadingMessage(getRandomLoadingMessage())
    setIsVisible(true)

    try {
      const roastText = await generateCourseRoast(courseData)
      setRoast(roastText)
    } catch (error: any) {
      console.error("Error generating roast:", error)

      // Provide a more user-friendly error message
      if (error.message?.includes("API key configuration")) {
        setError("Error de configuración: La clave API de Grok no está configurada correctamente.")
      } else {
        setError(`Error: ${error.message || "Algo salió mal al consultar a Elon"}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    handleGenerateRoast()
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <div className="mt-6">
      <div className="flex justify-center">
        <Button
          onClick={handleGenerateRoast}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Consultando a Elon...
            </>
          ) : (
            "¿Qué opinaría Elon Musk de mi curso?"
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-center text-sm">
          {error}
          <Button variant="link" size="sm" onClick={handleRetry} className="text-red-700 p-0 h-auto text-xs ml-2">
            Reintentar
          </Button>
        </div>
      )}

      {isVisible && (roast || isLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full bg-gradient-to-b from-gray-900 to-gray-800 text-white border-0 shadow-xl">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mr-4 flex-shrink-0">
                  <Image src="/images/elon-musk.png" alt="Elon Musk" width={64} height={64} className="object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-400">Elon Musk</h3>
                  <p className="text-gray-400 text-sm">CEO de Tesla, SpaceX, xAI, etc.</p>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700 min-h-[100px] flex items-center justify-center">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-2" />
                    <p className="text-gray-400 text-center italic">{loadingMessage}</p>
                  </div>
                ) : (
                  <p className="text-gray-100 italic">{roast}</p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Powered by v0.dev & Grok API</p>
                <div className="space-x-2">
                  {!isLoading && (
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-700"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Otro comentario
                    </Button>
                  )}
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-700"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
