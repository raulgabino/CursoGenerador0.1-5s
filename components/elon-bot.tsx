"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, X, RefreshCw } from "lucide-react"
import Image from "next/image"
import type { CourseData } from "@/types/course"
import { generateCourseRoast } from "@/app/actions/grok-actions"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface ElonBotProps {
  courseData: CourseData
  currentScreen: number
  onClose: () => void
}

// Predefined comments for immediate display while API loads
const INSTANT_COMMENTS = [
  "Analizando este intento de curso...",
  "Procesando esta obra maestra educativa...",
  "Calibrando mi sarcasmo para este curso...",
  "Comparando con los estándares de SpaceX...",
  "Preparando comentarios constructivamente destructivos...",
]

export default function ElonBot({ courseData, currentScreen, onClose }: ElonBotProps) {
  const [comment, setComment] = useState<string | null>(null)
  const [instantComment, setInstantComment] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Function to get a random instant comment
  const getRandomInstantComment = () => {
    const randomIndex = Math.floor(Math.random() * INSTANT_COMMENTS.length)
    return INSTANT_COMMENTS[randomIndex]
  }

  // Function to generate comment with retry logic
  const generateComment = async (shouldRetry = true) => {
    // Clean up any existing abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    // Set an instant comment immediately
    setInstantComment(getRandomInstantComment())

    // Set a timer to show the instant comment for at least 1.5 seconds
    // This prevents flickering if the API responds very quickly
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
    }

    loadingTimerRef.current = setTimeout(() => {
      loadingTimerRef.current = null
    }, 1500)

    try {
      // Generate a prompt based on the current screen
      let prompt = ""

      switch (currentScreen) {
        case 1: // Welcome screen
          prompt =
            "Haz un comentario sarcástico en español latino sobre alguien que está a punto de crear un curso. Menciona que probablemente será otro curso mediocre que nadie terminará. Usa expresiones latinoamericanas."
          break
        case 2: // Results screen
          prompt = `Haz un comentario sarcástico en español latino sobre alguien que está creando un curso titulado "${courseData.title || "sin título"}" para "${courseData.audience || "nadie en particular"}" que resolverá el problema "${courseData.problem || "ninguno específico"}". Menciona Tesla o SpaceX en tu respuesta. Usa expresiones latinoamericanas.`
          break
        case 3: // Evaluation screen
          prompt = `Haz un comentario sarcástico en español latino sobre el método de evaluación "${courseData.evaluationType || "no especificado"}" para un curso. Menciona que en SpaceX o Tesla no usamos evaluaciones tan básicas. Usa expresiones latinoamericanas.`
          break
        case 4: // Content screen
          prompt = `Haz un comentario sarcástico en español latino sobre la estructura de un curso que incluye "${courseData.structure?.split("\n")[0] || "nada interesante"}". Menciona que mis cohetes de SpaceX tienen una estructura más sólida. Usa expresiones latinoamericanas.`
          break
        case 5: // Review screen
          prompt = `Critica este curso con sarcasmo en español latino:
Título: "${courseData.title || "Sin título"}"
Audiencia: "${courseData.audience || "No especificada"}"
Duración: "${courseData.duration || "No especificada"}"
Problema: "${courseData.problem || "No especificado"}"
Propósito: "${courseData.purpose || "No especificado"}"
Evaluación: "${courseData.evaluationMethod || "No especificada"}"
Estructura: "${courseData.structure ? courseData.structure.split("\n").slice(0, 3).join(", ") + "..." : "No especificada"}"
Usa expresiones latinoamericanas y haz referencias a mis empresas como Tesla o SpaceX.`
          break
        case 6: // Final screen
          prompt = `Haz un comentario sarcástico en español latino sobre un curso que acaba de ser completado titulado "${courseData.title || "sin título"}". Menciona que probablemente no es tan revolucionario como Neuralink o Starlink. Usa expresiones latinoamericanas.`
          break
        default:
          prompt =
            "Haz un comentario sarcástico en español latino sobre alguien que está diseñando un curso educativo. Menciona que en Tesla o SpaceX hacemos las cosas de manera diferente. Usa expresiones latinoamericanas."
      }

      // Use a Promise with a timeout to handle the API call
      const commentText = await generateCourseRoast(courseData, prompt)

      // Wait for the minimum loading time to complete
      if (loadingTimerRef.current) {
        await new Promise((resolve) => {
          const checkTimer = setInterval(() => {
            if (!loadingTimerRef.current) {
              clearInterval(checkTimer)
              resolve(true)
            }
          }, 100)
        })
      }

      setComment(commentText)
      setIsLoading(false)
      setRetryCount(0) // Reset retry count on success
    } catch (error: any) {
      console.error("Error generating Elon comment:", error)

      // Wait for the minimum loading time to complete
      if (loadingTimerRef.current) {
        await new Promise((resolve) => {
          const checkTimer = setInterval(() => {
            if (!loadingTimerRef.current) {
              clearInterval(checkTimer)
              resolve(true)
            }
          }, 100)
        })
      }

      // If we should retry and haven't exceeded max retries
      if (shouldRetry && retryCount < 2) {
        setRetryCount((prev) => prev + 1)
        generateComment(false) // Retry once more but don't chain retries
      } else {
        setError(`Error: ${error.message || "Algo salió mal"}`)
        setIsLoading(false)

        // Set a fallback comment in Latin American Spanish
        setComment(
          "¿Otro curso educativo? ¡Qué original, carnal! Casi tan innovador como usar Windows 95 en 2025. En Tesla, reinventamos la industria automotriz. Tú estás reinventando... el aburrimiento. Ni mis cohetes de SpaceX caen tan rápido como caerá el interés en este curso.",
        )
      }
    }
  }

  // Effect to generate comment when component mounts or screen changes
  useEffect(() => {
    let isMounted = true

    const initializeComment = async () => {
      if (!isMounted) return
      await generateComment()
    }

    initializeComment()

    return () => {
      isMounted = false

      // Clean up timers and abort controller
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
        loadingTimerRef.current = null
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [courseData.title, currentScreen]) // Only re-run when title or screen changes

  const handleRetry = () => {
    generateComment()
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 500) // Wait for animation to complete
  }

  if (!isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="w-80 bg-gradient-to-b from-gray-900 to-gray-800 text-white border-0 shadow-xl">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 mr-3 flex-shrink-0">
                    <Image
                      src="/images/elon-musk.png"
                      alt="Elon Musk"
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-400">Elon Musk</h3>
                    <p className="text-gray-400 text-xs">CEO de Tesla, SpaceX, xAI</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-6 w-6 p-0 rounded-full text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg mb-2 border border-gray-700 min-h-[80px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400 mb-2" />
                    <p className="text-gray-400 text-sm text-center italic">{instantComment}</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center">
                    <p className="text-red-400 text-sm mb-2">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="text-xs border-gray-600 hover:bg-gray-700"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Reintentar
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-100 text-sm italic">{comment}</p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Powered by Grok</p>
                {!isLoading && !error && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="h-6 p-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Otro
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
