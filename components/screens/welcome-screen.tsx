"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface WelcomeScreenProps {
  onNext: () => void
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const handleNext = () => {
    try {
      onNext()
    } catch (error) {
      console.error("Error in WelcomeScreen when advancing:", error)
      // Try a fallback approach if the callback fails
      try {
        window.location.href = "/crear-curso?step=2"
      } catch (fallbackError) {
        console.error("Fallback navigation also failed:", fallbackError)
        alert("Hubo un problema al avanzar. Por favor, intenta recargar la página.")
      }
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
        <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-blue-800 mb-2">¡Bienvenido a Whorkshop!</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Estás a punto de crear un curso profesional utilizando la metodología de Diseño Invertido. Te guiaremos paso a
          paso en el proceso.
        </p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg mb-8 max-w-2xl mx-auto">
        <h3 className="font-bold text-lg text-blue-700 mb-3">¿Cómo funciona?</h3>
        <ol className="text-left space-y-4">
          <li className="flex items-start">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              1
            </span>
            <div>
              <p className="font-medium text-blue-800">Define los resultados deseados</p>
              <p className="text-sm text-gray-600">
                Establece qué problema resolverá tu curso y qué aprenderán los participantes.
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              2
            </span>
            <div>
              <p className="font-medium text-blue-800">Planifica la evaluación</p>
              <p className="text-sm text-gray-600">
                Decide cómo medirás el aprendizaje y qué evidencias demostrarán el éxito.
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              3
            </span>
            <div>
              <p className="font-medium text-blue-800">Organiza el contenido</p>
              <p className="text-sm text-gray-600">
                Estructura los módulos, actividades y materiales necesarios para lograr los objetivos.
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              4
            </span>
            <div>
              <p className="font-medium text-blue-800">Genera tu curso</p>
              <p className="text-sm text-gray-600">
                Obtén un documento profesional con todos los detalles de tu curso listo para implementar.
              </p>
            </div>
          </li>
        </ol>
      </div>

      <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 px-8 py-2">
        Comenzar diseño del curso
      </Button>
    </motion.div>
  )
}
