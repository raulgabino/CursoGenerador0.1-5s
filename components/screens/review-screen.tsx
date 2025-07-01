"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import type { CourseData } from "@/types/course"
import { generateAdditionalMaterials } from "@/app/actions/openai-actions"
import CourseRoaster from "@/components/course-roaster"

interface ReviewScreenProps {
  courseData: CourseData
  updateCourseData: (data: Partial<CourseData>) => void
  onNext: () => void
  onPrev: () => void
  setError: (error: string | null) => void
}

export default function ReviewScreen({ courseData, updateCourseData, onNext, onPrev, setError }: ReviewScreenProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateCourse = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // If additional materials were requested, generate them
      if (courseData.additionalMaterials && !courseData.additionalMaterialsContent) {
        try {
          console.log("Generating additional materials...")
          const additionalMaterialsContent = await generateAdditionalMaterials(courseData)
          console.log("Additional materials generated successfully")
          updateCourseData({ additionalMaterialsContent })
        } catch (error) {
          console.error("Error generating additional materials:", error)
          // Show error to user but continue with course generation
          setError(
            "Hubo un problema al generar los materiales adicionales, pero el curso se generará con contenido básico.",
          )

          // Provide fallback content in case of error
          updateCourseData({
            additionalMaterialsContent: `
## Libros recomendados
- "Introducción a ${courseData.title || "la metodología didáctica"}" por Juan Pérez
- "Diseño de cursos efectivos" por María Rodríguez
- "Evaluación del aprendizaje" por Carlos Gómez

## Recursos en línea
- Plataforma EdX: cursos gratuitos sobre pedagogía
- Canal de YouTube "Educación Innovadora"
- Sitio web Coursera: especialización en diseño instruccional

## Herramientas
- Miro para mapas mentales colaborativos
- Kahoot para evaluaciones interactivas
- Canva para diseño de materiales educativos
         `,
          })
        }
      }

      // Advance to the final screen
      onNext()
    } catch (error: any) {
      console.error("Error generating course:", error)
      setError(
        `Hubo un problema al generar el curso: ${error.message || "Error desconocido"}. Por favor, intenta de nuevo.`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="py-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Paso 4: Revisa y genera tu curso</h2>
        <p className="text-gray-600">Revisa la información de tu curso antes de generar el documento final.</p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h3 className="font-bold text-lg text-blue-700 mb-4">Resumen del curso</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-blue-800">Información general</h4>
            <div className="bg-white rounded p-3 mt-2">
              <p className="font-bold">{courseData.title || "Sin título"}</p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Público:</span> {courseData.audience || "No especificado"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Modalidad:</span> {courseData.modality || "No especificada"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Duración:</span> {courseData.duration || "No especificada"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Certificado:</span> {courseData.certificate ? "Sí" : "No"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-800">Propósito y problema</h4>
            <div className="bg-white rounded p-3 mt-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Problema:</span> {courseData.problem || "No especificado"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Propósito:</span> {courseData.purpose || "No especificado"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Experiencia previa:</span> {courseData.experience || "No especificada"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-800">Evaluación</h4>
            <div className="bg-white rounded p-3 mt-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Método:</span> {courseData.evaluationMethod || "No especificado"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Tipo:</span> {courseData.evaluationType || "No especificado"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-800">Estructura</h4>
            <div className="bg-white rounded p-3 mt-2">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {courseData.structure || "No especificada"}
              </pre>
            </div>
          </div>

          {courseData.materials && (
            <div>
              <h4 className="font-medium text-blue-800">Materiales</h4>
              <div className="bg-white rounded p-3 mt-2">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">{courseData.materials}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add the Course Roaster component */}
      <CourseRoaster courseData={courseData} />

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onPrev}>
          Atrás
        </Button>
        <Button onClick={handleGenerateCourse} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando curso...
            </>
          ) : (
            "Generar curso"
          )}
        </Button>
      </div>
    </motion.div>
  )
}
