"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import type { CourseData } from "@/types/course"

interface ResultsScreenProps {
  courseData: CourseData
  updateCourseData: (data: Partial<CourseData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function ResultsScreen({ courseData, updateCourseData, onNext, onPrev }: ResultsScreenProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!courseData.title?.trim()) {
      newErrors.title = "El título del curso es obligatorio"
    }

    if (!courseData.audience?.trim()) {
      newErrors.audience = "El público objetivo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
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
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Paso 1: Define los resultados deseados</h2>
        <p className="text-gray-600">
          Comienza definiendo el propósito de tu curso y qué problema resolverá para los participantes.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="title" className="text-base font-medium">
            Título del curso <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={courseData.title || ""}
            onChange={(e) => updateCourseData({ title: e.target.value })}
            placeholder="Ej: Introducción al Marketing Digital"
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <Label htmlFor="problem" className="text-base font-medium">
            ¿Qué problema resolverá este curso?
          </Label>
          <Textarea
            id="problem"
            value={courseData.problem || ""}
            onChange={(e) => updateCourseData({ problem: e.target.value })}
            placeholder="Ej: Muchas personas quieren iniciar en marketing digital pero no conocen las bases fundamentales"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="purpose" className="text-base font-medium">
            ¿Cuál es el propósito principal del curso?
          </Label>
          <Textarea
            id="purpose"
            value={courseData.purpose || ""}
            onChange={(e) => updateCourseData({ purpose: e.target.value })}
            placeholder="Ej: Proporcionar los conocimientos básicos para que los participantes puedan iniciar campañas de marketing digital efectivas"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="audience" className="text-base font-medium">
            ¿A quién va dirigido este curso? <span className="text-red-500">*</span>
          </Label>
          <Input
            id="audience"
            value={courseData.audience || ""}
            onChange={(e) => updateCourseData({ audience: e.target.value })}
            placeholder="Ej: Emprendedores y profesionales sin experiencia en marketing digital"
            className={errors.audience ? "border-red-500" : ""}
          />
          {errors.audience && <p className="text-red-500 text-sm mt-1">{errors.audience}</p>}
        </div>

        <div>
          <Label htmlFor="experience" className="text-base font-medium">
            ¿Qué experiencia previa necesitan los participantes?
          </Label>
          <Input
            id="experience"
            value={courseData.experience || ""}
            onChange={(e) => updateCourseData({ experience: e.target.value })}
            placeholder="Ej: No se requiere experiencia previa, solo conocimientos básicos de internet"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="modality" className="text-base font-medium">
              Modalidad del curso
            </Label>
            <Input
              id="modality"
              value={courseData.modality || ""}
              onChange={(e) => updateCourseData({ modality: e.target.value })}
              placeholder="Ej: Online, presencial, híbrido"
            />
          </div>

          <div>
            <Label htmlFor="duration" className="text-base font-medium">
              Duración estimada
            </Label>
            <Input
              id="duration"
              value={courseData.duration || ""}
              onChange={(e) => updateCourseData({ duration: e.target.value })}
              placeholder="Ej: 4 semanas, 20 horas"
            />
          </div>
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
