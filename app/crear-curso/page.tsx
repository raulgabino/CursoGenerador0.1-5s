"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import WelcomeScreen from "@/components/screens/welcome-screen"
import ReviewScreen from "@/components/screens/review-screen"
import ContentScreen from "@/components/screens/content-screen"
import EvaluationScreen from "@/components/screens/evaluation-screen"
import FinalScreen from "@/components/screens/final-screen"
import ResultsScreen from "@/components/screens/results-screen"
import type { CourseData } from "@/types/course"

export default function CreateCoursePage() {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [courseData, setCourseData] = useState<CourseData>({
    title: "",
    audience: "",
    modality: "",
    duration: "",
    certificate: false,
    problem: "",
    purpose: "",
    experience: "",
    structure: [], // ✅ CRÍTICO: Inicializar como array vacío
    evaluationMethod: "",
    evaluationType: "",
    materials: "",
    additionalMaterials: false,
    additionalMaterialsContent: "",
    lastScreen: 0,
    location: "",
    platform: "",
    theoreticalContext: "",
    practicalContext: "",
  })

  const updateCourseData = (data: Partial<CourseData>) => {
    console.log("🔄 Actualizando courseData:", data)
    setCourseData((prev) => {
      const updated = { ...prev, ...data }
      console.log("📊 courseData actualizado:", updated)
      return updated
    })
  }

  const nextScreen = () => {
    console.log("➡️ Avanzando a pantalla:", currentScreen + 1)
    console.log("📋 courseData actual:", courseData)
    setCurrentScreen((prev) => prev + 1)
  }

  const prevScreen = () => {
    console.log("⬅️ Retrocediendo a pantalla:", currentScreen - 1)
    setCurrentScreen((prev) => prev - 1)
  }

  const screens = [
    <WelcomeScreen key="welcome" courseData={courseData} updateCourseData={updateCourseData} onNext={nextScreen} />,
    <ContentScreen
      key="content"
      courseData={courseData}
      updateCourseData={updateCourseData} // ✅ Prop correcta
      onNext={nextScreen}
      onPrev={prevScreen} // ✅ Prop correcta
    />,
    <EvaluationScreen
      key="evaluation"
      courseData={courseData}
      updateCourseData={updateCourseData}
      onNext={nextScreen}
      onPrev={prevScreen}
    />,
    <ReviewScreen
      key="review"
      courseData={courseData}
      updateCourseData={updateCourseData}
      onNext={nextScreen}
      onPrev={prevScreen}
      setError={() => {}}
    />,
    <FinalScreen key="final" courseData={courseData} onReset={() => setCurrentScreen(0)} />,
    <ResultsScreen key="results" courseData={courseData} onRestart={() => setCurrentScreen(0)} />,
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-blue-800">Diseñador de Cursos IA</h1>
              <div className="text-sm text-gray-500">
                Paso {currentScreen + 1} de {screens.length}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentScreen + 1) / screens.length) * 100}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              {screens[currentScreen]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
