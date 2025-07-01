"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import WelcomeScreen from "@/components/screens/welcome-screen"
import ResultsScreen from "@/components/screens/results-screen"
import EvaluationScreen from "@/components/screens/evaluation-screen"
import ContentScreen from "@/components/screens/content-screen"
import ReviewScreen from "@/components/screens/review-screen"
import FinalScreen from "@/components/screens/final-screen"
import ElonBot from "@/components/elon-bot"
import type { CourseData } from "@/types/course"
import { saveCourseData, loadCourseData, clearCourseData } from "@/lib/storage-utils"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Datos iniciales vacíos para un nuevo curso
const initialCourseData: CourseData = {
  title: "",
  certificate: false,
  additionalMaterials: false,
}

export default function CrearCurso() {
  const searchParams = useSearchParams()
  const continueCourse = searchParams?.get("continue") === "true"

  const [currentScreen, setCurrentScreen] = useState(1)
  const [courseData, setCourseData] = useState<CourseData>(initialCourseData)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [showElonBot, setShowElonBot] = useState(false)

  // Set isMounted to true when component mounts
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Cargar datos guardados al iniciar
  useEffect(() => {
    if (!isMounted) return

    const loadSavedData = () => {
      setIsLoading(true)
      try {
        const savedData = loadCourseData()

        if (savedData && continueCourse) {
          setCourseData((prevData) => ({
            ...initialCourseData, // Always start with initialCourseData as base
            ...savedData, // Then apply saved data
          }))
          // If there are data saved and the user wants to continue, go to the saved screen or to the first one
          setCurrentScreen(savedData.lastScreen && savedData.lastScreen > 0 ? savedData.lastScreen : 1)
        } else if (!continueCourse) {
          // If the user doesn't want to continue, clear saved data
          clearCourseData()
          setCourseData(initialCourseData)
          setCurrentScreen(1)
        }
      } catch (error) {
        console.error("Error loading saved data:", error)
        // If there's an error, reset to initial state
        clearCourseData()
        setCourseData(initialCourseData)
        setCurrentScreen(1)
        setError("Hubo un problema al cargar tus datos guardados. Se ha iniciado un nuevo curso.")
      } finally {
        setIsLoading(false)
        // Show Elon bot after a short delay
        setTimeout(() => {
          setShowElonBot(true)
        }, 1000)
      }
    }

    loadSavedData()
  }, [continueCourse, isMounted])

  // Guardar datos automáticamente cuando cambian
  useEffect(() => {
    if (!isMounted || isLoading) return

    try {
      if (courseData.title) {
        const dataToSave = {
          ...courseData,
          lastScreen: currentScreen,
        }
        saveCourseData(dataToSave)
      }
    } catch (error) {
      console.error("Error saving course data:", error)
      // Don't set error state here to avoid UI disruption
    }
  }, [courseData, currentScreen, isLoading, isMounted])

  const updateCourseData = (data: Partial<CourseData>) => {
    setCourseData((prev) => ({ ...prev, ...data }))
  }

  const nextScreen = () => {
    setCurrentScreen((prev) => prev + 1)
  }

  const prevScreen = () => {
    setCurrentScreen((prev) => prev - 1)
  }

  const resetCourseData = () => {
    clearCourseData()
    setCourseData(initialCourseData)
    setCurrentScreen(1)
    // Show Elon bot after reset
    setTimeout(() => {
      setShowElonBot(true)
    }, 1000)
  }

  const handleCloseElonBot = () => {
    setShowElonBot(false)
  }

  if (!isMounted) {
    return null // Return nothing during SSR
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-800">Whorkshop</h1>
          <div className="flex space-x-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                Volver al inicio
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const confirmed = window.confirm(
                  "¿Estás seguro de que quieres empezar un nuevo curso? Tus datos actuales se guardarán.",
                )
                if (confirmed) {
                  resetCourseData()
                }
              }}
            >
              Nuevo curso
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-500 ease-in-out">
          {currentScreen === 1 && <WelcomeScreen onNext={nextScreen} />}

          {currentScreen === 2 && (
            <ResultsScreen
              courseData={courseData}
              updateCourseData={updateCourseData}
              onNext={nextScreen}
              onPrev={prevScreen}
            />
          )}

          {currentScreen === 3 && (
            <EvaluationScreen
              courseData={courseData}
              updateCourseData={updateCourseData}
              onNext={nextScreen}
              onPrev={prevScreen}
            />
          )}

          {currentScreen === 4 && (
            <ContentScreen
              courseData={courseData}
              updateCourseData={updateCourseData}
              onNext={nextScreen}
              onPrev={prevScreen}
            />
          )}

          {currentScreen === 5 && (
            <ReviewScreen
              courseData={courseData}
              updateCourseData={updateCourseData}
              onNext={nextScreen}
              onPrev={prevScreen}
              setError={setError}
            />
          )}

          {currentScreen === 6 && <FinalScreen courseData={courseData} onReset={resetCourseData} />}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  currentScreen === step ? "bg-blue-600" : currentScreen > step ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Elon Bot */}
      {showElonBot && <ElonBot courseData={courseData} currentScreen={currentScreen} onClose={handleCloseElonBot} />}
    </main>
  )
}
