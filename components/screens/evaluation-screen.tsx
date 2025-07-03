"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"
import { Loader2, Sparkles } from "lucide-react"
import type { CourseData } from "@/types/course"
import { generateEvaluationMethod } from "@/app/actions/suggestion-actions"

interface EvaluationScreenProps {
  courseData: CourseData
  updateCourseData: (data: Partial<CourseData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function EvaluationScreen({ courseData, updateCourseData, onNext, onPrev }: EvaluationScreenProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGeneratingEvaluation, setIsGeneratingEvaluation] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!courseData.evaluationMethod?.trim()) {
      newErrors.evaluationMethod = "El método de evaluación es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const handleGenerateEvaluation = async () => {
    setIsGeneratingEvaluation(true)
    setAiError(null)

    try {
      const evaluationSuggestion = await generateEvaluationMethod(courseData)
      const suggestionText =
        typeof evaluationSuggestion === "string" ? evaluationSuggestion : JSON.stringify(evaluationSuggestion, null, 2)

      updateCourseData({ evaluationMethod: suggestionText })
    } catch (error: any) {
      console.error("Error generating evaluation method:", error)
      setAiError(`Error al generar método de evaluación: ${error.message || "Error desconocido"}`)
    } finally {
      setIsGeneratingEvaluation(false)
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
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Paso 2: Planifica la evaluación</h2>
        <p className="text-gray-600">
          Define cómo evaluarás el aprendizaje y qué evidencias demostrarán que los participantes han alcanzado los
          objetivos.
        </p>
      </div>

      {aiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{aiError}</div>}

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="evaluationMethod" className="text-base font-medium">
              ¿Cómo evaluarás el aprendizaje? <span className="text-red-500">*</span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateEvaluation}
              disabled={isGeneratingEvaluation || !courseData.title}
              className="flex items-center gap-1 bg-transparent"
            >
              {isGeneratingEvaluation ? (
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
          <Textarea
            id="evaluationMethod"
            value={courseData.evaluationMethod || ""}
            onChange={(e) => updateCourseData({ evaluationMethod: e.target.value })}
            placeholder="Ej: A través de un proyecto final donde los participantes diseñarán una campaña de marketing digital"
            rows={3}
            className={errors.evaluationMethod ? "border-red-500" : ""}
          />
          {errors.evaluationMethod && <p className="text-red-500 text-sm mt-1">{errors.evaluationMethod}</p>}
        </div>

        <div>
          <Label className="text-base font-medium mb-2 block">Tipo de evaluación</Label>
          <RadioGroup
            value={courseData.evaluationType || "mixta"}
            onValueChange={(value) => updateCourseData({ evaluationType: value })}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="font-normal">
                Manual (revisada por instructor)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="automatica" id="automatica" />
              <Label htmlFor="automatica" className="font-normal">
                Automática (cuestionarios, tests)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mixta" id="mixta" />
              <Label htmlFor="mixta" className="font-normal">
                Mixta (combinación de ambas)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="certificate" className="text-base font-medium">
              ¿Se otorgará certificado?
            </Label>
            <p className="text-sm text-gray-500">Los participantes recibirán un certificado al completar el curso</p>
          </div>
          <Switch
            id="certificate"
            checked={courseData.certificate || false}
            onCheckedChange={(checked) => updateCourseData({ certificate: checked })}
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
