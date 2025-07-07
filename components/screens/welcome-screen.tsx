"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"
import type { CourseData } from "@/types/course"

interface WelcomeScreenProps {
  courseData: CourseData
  updateCourseData: (data: Partial<CourseData>) => void
  onNext: () => void
}

export default function WelcomeScreen({ courseData, updateCourseData, onNext }: WelcomeScreenProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!courseData.title?.trim()) {
      newErrors.title = "El título del curso es obligatorio"
    }

    if (!courseData.audience?.trim()) {
      newErrors.audience = "La audiencia objetivo es obligatoria"
    }

    if (!courseData.problem?.trim()) {
      newErrors.problem = "Debes describir el problema que resuelve el curso"
    }

    if (!courseData.purpose?.trim()) {
      newErrors.purpose = "Debes describir el propósito del curso"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    console.log("🔍 DIAGNÓSTICO - WelcomeScreen handleNext llamado") // LOG DE DIAGNÓSTICO
    console.log("🔍 DIAGNÓSTICO - courseData en WelcomeScreen:", courseData) // LOG DE DIAGNÓSTICO

    if (validateForm()) {
      console.log("🔍 DIAGNÓSTICO - Validación exitosa, llamando onNext") // LOG DE DIAGNÓSTICO
      onNext()
    } else {
      console.log("🔍 DIAGNÓSTICO - Validación falló, errores:", errors) // LOG DE DIAGNÓSTICO
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
          <Label htmlFor="audience" className="text-base font-medium">
            Audiencia objetivo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="audience"
            value={courseData.audience || ""}
            onChange={(e) => updateCourseData({ audience: e.target.value })}
            placeholder="Ej: Emprendedores sin experiencia en marketing"
            className={errors.audience ? "border-red-500" : ""}
          />
          {errors.audience && <p className="text-red-500 text-sm mt-1">{errors.audience}</p>}
        </div>

        <div>
          <Label className="text-base font-medium">Modalidad del curso</Label>
          <RadioGroup
            value={courseData.modality || ""}
            onValueChange={(value) => updateCourseData({ modality: value })}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="presencial" id="presencial" />
              <Label htmlFor="presencial">Presencial</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="virtual" id="virtual" />
              <Label htmlFor="virtual">Virtual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hibrido" id="hibrido" />
              <Label htmlFor="hibrido">Híbrido</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="duration" className="text-base font-medium">
            Duración estimada
          </Label>
          <Input
            id="duration"
            value={courseData.duration || ""}
            onChange={(e) => updateCourseData({ duration: e.target.value })}
            placeholder="Ej: 8 semanas, 40 horas"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="certificate" className="text-base font-medium">
              ¿Otorga certificado?
            </Label>
            <p className="text-sm text-gray-500">Los participantes recibirán un certificado al completar el curso</p>
          </div>
          <Switch
            id="certificate"
            checked={courseData.certificate || false}
            onCheckedChange={(checked) => updateCourseData({ certificate: checked })}
          />
        </div>

        <div>
          <Label htmlFor="problem" className="text-base font-medium">
            ¿Qué problema resuelve este curso? <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="problem"
            value={courseData.problem || ""}
            onChange={(e) => updateCourseData({ problem: e.target.value })}
            placeholder="Describe el problema específico que enfrentan tus estudiantes y cómo este curso los ayudará a resolverlo"
            rows={3}
            className={errors.problem ? "border-red-500" : ""}
          />
          {errors.problem && <p className="text-red-500 text-sm mt-1">{errors.problem}</p>}
        </div>

        <div>
          <Label htmlFor="purpose" className="text-base font-medium">
            ¿Cuál es el propósito del curso? <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="purpose"
            value={courseData.purpose || ""}
            onChange={(e) => updateCourseData({ purpose: e.target.value })}
            placeholder="Explica qué lograrán los estudiantes al completar el curso y cómo transformará sus habilidades o conocimientos"
            rows={3}
            className={errors.purpose ? "border-red-500" : ""}
          />
          {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>}
        </div>

        <div>
          <Label htmlFor="experience" className="text-base font-medium">
            Nivel de experiencia requerido
          </Label>
          <RadioGroup
            value={courseData.experience || ""}
            onValueChange={(value) => updateCourseData({ experience: value })}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="principiante" id="principiante" />
              <Label htmlFor="principiante">Principiante (sin experiencia previa)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermedio" id="intermedio" />
              <Label htmlFor="intermedio">Intermedio (conocimientos básicos)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="avanzado" id="avanzado" />
              <Label htmlFor="avanzado">Avanzado (experiencia significativa)</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button onClick={handleNext}>Continuar</Button>
      </div>
    </motion.div>
  )
}
