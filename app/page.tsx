"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { loadCourseData } from "@/lib/storage-utils"
import { useState, useEffect } from "react"

export default function Home() {
  const router = useRouter()
  const [hasSavedData, setHasSavedData] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Verificar si hay datos guardados al cargar la página
    try {
      const savedData = loadCourseData()
      setHasSavedData(!!savedData)
    } catch (error) {
      console.error("Error loading saved data:", error)
      setHasSavedData(false)
    }
  }, [isMounted])

  const handleStartNewCourse = () => {
    try {
      router.push("/crear-curso")
    } catch (error) {
      console.error("Error navigating to crear-curso:", error)
      // Fallback to window.location if router.push fails
      window.location.href = "/crear-curso"
    }
  }

  const handleContinueCourse = () => {
    try {
      router.push("/crear-curso?continue=true")
    } catch (error) {
      console.error("Error navigating to crear-curso with continue param:", error)
      // Fallback to window.location if router.push fails
      window.location.href = "/crear-curso?continue=true"
    }
  }

  if (!isMounted) {
    return null // No renderizar nada durante SSR
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-800">Whorkshop</h1>
          <p className="text-gray-600">Diseña cursos profesionales en minutos</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">¿Cómo funciona Whorkshop?</h2>
            <p className="text-gray-600 mb-6">
              Whorkshop utiliza inteligencia artificial avanzada para ayudarte a diseñar cursos profesionales siguiendo
              la metodología de Diseño Invertido (Backward Design).
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl text-blue-700 mb-3">¿Qué es el Diseño Invertido?</h3>
              <p className="text-gray-700">
                Es una metodología que comienza definiendo los resultados deseados antes de planificar las actividades
                de aprendizaje. Esto garantiza que todo el contenido esté alineado con los objetivos educativos.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl text-blue-700 mb-3">¿Por qué usar Whorkshop?</h3>
              <p className="text-gray-700">
                Whorkshop te ahorra tiempo, te guía paso a paso y te ofrece sugerencias personalizadas basadas en IA
                para crear cursos profesionales y efectivos en minutos, no en días.
              </p>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="font-bold text-xl text-blue-700 mb-4 text-center">Proceso en 4 pasos</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  step: 1,
                  title: "Define resultados",
                  desc: "Establece qué aprenderán los participantes",
                },
                {
                  step: 2,
                  title: "Planifica evaluación",
                  desc: "Decide cómo medirás el aprendizaje",
                },
                {
                  step: 3,
                  title: "Organiza contenido",
                  desc: "Estructura módulos y materiales",
                },
                {
                  step: 4,
                  title: "Genera tu curso",
                  desc: "Obtén un PDF profesional listo para usar",
                },
              ].map((item) => (
                <div key={item.step} className="bg-white border border-blue-100 rounded-lg p-4 text-center">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                    {item.step}
                  </div>
                  <h4 className="font-medium text-blue-800 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              onClick={handleStartNewCourse}
            >
              Crear nuevo curso
            </Button>

            {hasSavedData && (
              <div>
                <p className="text-gray-600 mb-2">¿Tienes un curso en progreso?</p>
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                  onClick={handleContinueCourse}
                >
                  Continuar curso guardado
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="font-bold text-lg text-blue-700 mb-2">¿Necesitas ayuda?</h3>
          <p className="text-gray-700 mb-4">
            Whorkshop está diseñado para ser intuitivo, pero si tienes preguntas, estamos aquí para ayudarte.
          </p>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-100 bg-transparent">
            Ver guía de uso
          </Button>
        </div>
      </div>
    </main>
  )
}
