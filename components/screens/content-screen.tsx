"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"
import { Loader2, Sparkles } from "lucide-react"
import type { CourseData } from "@/types/course"
import { generateCourseStructure, generateMaterialSuggestions } from "@/app/actions/suggestion-actions"

interface ContentScreenProps {
  courseData: CourseData
  updateCourseData: (data: Partial<CourseData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function ContentScreen({ courseData, updateCourseData, onNext, onPrev }: ContentScreenProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false)
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!courseData.structure?.trim()) {
      newErrors.structure = "La estructura del curso es obligatoria"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const handleGenerateStructure = async () => {
    setIsGeneratingStructure(true)
    setAiError(null)

    try {
      const structureSuggestion = await generateCourseStructure({
        title: courseData.title,
        audience: courseData.audience,
        problem: courseData.problem,
        purpose: courseData.purpose,
        experience: courseData.experience,
        duration: courseData.duration,
      })

      updateCourseData({ structure: structureSuggestion })
    } catch (error: any) {
      console.error("Error generating structure:", error)
      setAiError(`Error al generar estructura: ${error.message || "Error desconocido"}`)
    } finally {
      setIsGeneratingStructure(false)
    }
  }

  const handleGenerateMaterials = async () => {
    setIsGeneratingMaterials(true)
    setAiError(null)

    try {
      const materialsSuggestion = await generateMaterialSuggestions({
        title: courseData.title,
        audience: courseData.audience,
        problem: courseData.problem,
        purpose: courseData.purpose,
        structure: courseData.structure,
      })

      updateCourseData({ materials: materialsSuggestion })
    } catch (error: any) {
      console.error("Error generating materials:", error)
      setAiError(`Error al generar materiales: ${error.message || "Error desconocido"}`)
    } finally {
      setIsGeneratingMaterials(false)
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
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Paso 3: Organiza el contenido</h2>
        <p className="text-gray-600">
          Define la estructura de tu curso y los materiales necesarios para lograr los objetivos de aprendizaje.
        </p>
      </div>

      {aiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{aiError}</div>}

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="structure" className="text-base font-medium">
              Estructura del curso <span className="text-red-500">*</span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateStructure}
              disabled={isGeneratingStructure || !courseData.title}
              className="flex items-center gap-1"
            >
              {isGeneratingStructure ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Sugerir con IA
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mb-2">Enumera los módulos o unidades principales (uno por línea)</p>
          <Textarea
            id="structure"
            value={courseData.structure || ""}
            onChange={(e) => updateCourseData({ structure: e.target.value })}
            placeholder="Ej:
1. Introducción al marketing digital
2. Fundamentos de SEO
3. Marketing en redes sociales
4. Publicidad PPC
5. Análisis y métricas"
            rows={6}
            className={errors.structure ? "border-red-500" : ""}
          />
          {errors.structure && <p className="text-red-500 text-sm mt-1">{errors.structure}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="materials" className="text-base font-medium">
              Materiales necesarios
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateMaterials}
              disabled={isGeneratingMaterials || !courseData.title}
              className="flex items-center gap-1"
            >
              {isGeneratingMaterials ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Sugerir con IA
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Lista los materiales que utilizarás para impartir el curso (uno por línea)
          </p>
          <Textarea
            id="materials"
            value={courseData.materials || ""}
            onChange={(e) => updateCourseData({ materials: e.target.value })}
            placeholder="Ej:
- Presentaciones de diapositivas
- Guías de ejercicios prácticos
- Videos tutoriales
- Plantillas de trabajo"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="additionalMaterials" className="text-base font-medium">
              ¿Incluir materiales adicionales?
            </Label>
            <p className="text-sm text-gray-500">La IA generará una lista de recursos complementarios recomendados</p>
          </div>
          <Switch
            id="additionalMaterials"
            checked={courseData.additionalMaterials || false}
            onCheckedChange={(checked) => updateCourseData({ additionalMaterials: checked })}
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onPrev}>
          Atrás
        </Button>
        <Button onClick={handleNext}>Continuar</Button>
      </div>
    </motion.div>
  )
}
