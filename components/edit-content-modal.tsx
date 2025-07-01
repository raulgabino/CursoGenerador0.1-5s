"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Save, AlertCircle } from "lucide-react"
import type { CourseData } from "@/types/course"
import { motion } from "framer-motion"

interface EditContentModalProps {
  courseData: CourseData
  onSave: (data: CourseData) => void
  onClose: () => void
}

export default function EditContentModal({ courseData, onSave, onClose }: EditContentModalProps) {
  const [editedData, setEditedData] = useState<CourseData>({ ...courseData })
  const [activeTab, setActiveTab] = useState("general")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<Record<string, string>>({})
  const [isVisible, setIsVisible] = useState(true)

  // Character limits for different fields
  const CHAR_LIMITS = {
    title: 100,
    audience: 100,
    problem: 500,
    purpose: 500,
    experience: 300,
    evaluationMethod: 1000,
    moduleTitle: 100,
    moduleDescription: 300,
  }

  // Validate content length and set warnings
  useEffect(() => {
    const newWarnings: Record<string, string> = {}

    // Check title length
    if (editedData.title && editedData.title.length > CHAR_LIMITS.title * 0.8) {
      newWarnings.title = `El título es muy largo (${editedData.title.length}/${CHAR_LIMITS.title} caracteres)`
    }

    // Check problem length
    if (editedData.problem && editedData.problem.length > CHAR_LIMITS.problem * 0.8) {
      newWarnings.problem = `La descripción del problema es muy larga (${editedData.problem.length}/${CHAR_LIMITS.problem} caracteres)`
    }

    // Check purpose length
    if (editedData.purpose && editedData.purpose.length > CHAR_LIMITS.purpose * 0.8) {
      newWarnings.purpose = `La descripción del propósito es muy larga (${editedData.purpose.length}/${CHAR_LIMITS.purpose} caracteres)`
    }

    // Check evaluation method length
    if (editedData.evaluationMethod && editedData.evaluationMethod.length > CHAR_LIMITS.evaluationMethod * 0.8) {
      newWarnings.evaluationMethod = `El método de evaluación es muy largo (${editedData.evaluationMethod.length}/${CHAR_LIMITS.evaluationMethod} caracteres)`
    }

    // Check structure - each line should be under the module title limit
    if (editedData.structure) {
      const lines = editedData.structure.split("\n")
      const longLines = lines.filter((line) => line.length > CHAR_LIMITS.moduleTitle)
      if (longLines.length > 0) {
        newWarnings.structure = `${longLines.length} módulo(s) tienen títulos muy largos (máximo recomendado: ${CHAR_LIMITS.moduleTitle} caracteres)`
      }
    }

    setWarnings(newWarnings)
  }, [editedData])

  // Validate form before saving
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!editedData.title?.trim()) {
      newErrors.title = "El título del curso es obligatorio"
    }

    if (!editedData.audience?.trim()) {
      newErrors.audience = "El público objetivo es obligatorio"
    }

    if (!editedData.structure?.trim()) {
      newErrors.structure = "La estructura del curso es obligatoria"
    }

    if (!editedData.evaluationMethod?.trim()) {
      newErrors.evaluationMethod = "El método de evaluación es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(editedData)
      handleClose()
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0]
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const updateField = (field: keyof CourseData, value: any) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: isVisible ? 1 : 0.9, opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-blue-800">Editar contenido del curso</h2>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="structure">Estructura</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluación</TabsTrigger>
              <TabsTrigger value="materials">Materiales</TabsTrigger>
            </TabsList>

            {/* General Information Tab */}
            <TabsContent value="general" className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-medium">
                  Título del curso <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={editedData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Ej: Introducción al Marketing Digital"
                  className={errors.title ? "border-red-500" : warnings.title ? "border-yellow-500" : ""}
                  maxLength={CHAR_LIMITS.title}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                {warnings.title && !errors.title && (
                  <p className="text-yellow-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> {warnings.title}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {editedData.title?.length || 0}/{CHAR_LIMITS.title} caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="audience" className="text-base font-medium">
                  Público objetivo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="audience"
                  value={editedData.audience || ""}
                  onChange={(e) => updateField("audience", e.target.value)}
                  placeholder="Ej: Emprendedores y profesionales sin experiencia en marketing digital"
                  className={errors.audience ? "border-red-500" : ""}
                  maxLength={CHAR_LIMITS.audience}
                />
                {errors.audience && <p className="text-red-500 text-sm mt-1">{errors.audience}</p>}
                <p className="text-gray-500 text-xs mt-1">
                  {editedData.audience?.length || 0}/{CHAR_LIMITS.audience} caracteres
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modality" className="text-base font-medium">
                    Modalidad del curso
                  </Label>
                  <Input
                    id="modality"
                    value={editedData.modality || ""}
                    onChange={(e) => updateField("modality", e.target.value)}
                    placeholder="Ej: Online, presencial, híbrido"
                  />
                </div>

                <div>
                  <Label htmlFor="duration" className="text-base font-medium">
                    Duración estimada
                  </Label>
                  <Input
                    id="duration"
                    value={editedData.duration || ""}
                    onChange={(e) => updateField("duration", e.target.value)}
                    placeholder="Ej: 4 semanas, 20 horas"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="problem" className="text-base font-medium">
                  ¿Qué problema resolverá este curso?
                </Label>
                <Textarea
                  id="problem"
                  value={editedData.problem || ""}
                  onChange={(e) => updateField("problem", e.target.value)}
                  placeholder="Ej: Muchas personas quieren iniciar en marketing digital pero no conocen las bases fundamentales"
                  rows={3}
                  className={warnings.problem ? "border-yellow-500" : ""}
                  maxLength={CHAR_LIMITS.problem}
                />
                {warnings.problem && (
                  <p className="text-yellow-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> {warnings.problem}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {editedData.problem?.length || 0}/{CHAR_LIMITS.problem} caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="purpose" className="text-base font-medium">
                  ¿Cuál es el propósito principal del curso?
                </Label>
                <Textarea
                  id="purpose"
                  value={editedData.purpose || ""}
                  onChange={(e) => updateField("purpose", e.target.value)}
                  placeholder="Ej: Proporcionar los conocimientos básicos para que los participantes puedan iniciar campañas de marketing digital efectivas"
                  rows={3}
                  className={warnings.purpose ? "border-yellow-500" : ""}
                  maxLength={CHAR_LIMITS.purpose}
                />
                {warnings.purpose && (
                  <p className="text-yellow-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> {warnings.purpose}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {editedData.purpose?.length || 0}/{CHAR_LIMITS.purpose} caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="experience" className="text-base font-medium">
                  ¿Qué experiencia previa necesitan los participantes?
                </Label>
                <Input
                  id="experience"
                  value={editedData.experience || ""}
                  onChange={(e) => updateField("experience", e.target.value)}
                  placeholder="Ej: No se requiere experiencia previa, solo conocimientos básicos de internet"
                  maxLength={CHAR_LIMITS.experience}
                />
                <p className="text-gray-500 text-xs mt-1">
                  {editedData.experience?.length || 0}/{CHAR_LIMITS.experience} caracteres
                </p>
              </div>
            </TabsContent>

            {/* Structure Tab */}
            <TabsContent value="structure" className="space-y-6">
              <div>
                <Label htmlFor="structure" className="text-base font-medium">
                  Estructura del curso <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-gray-500 mb-2">
                  Enumera los módulos o unidades principales (uno por línea). Cada línea debe tener menos de{" "}
                  {CHAR_LIMITS.moduleTitle} caracteres para una visualización óptima.
                </p>
                <Textarea
                  id="structure"
                  value={editedData.structure || ""}
                  onChange={(e) => updateField("structure", e.target.value)}
                  placeholder="Ej:
1. Introducción al marketing digital
2. Fundamentos de SEO
3. Marketing en redes sociales
4. Publicidad PPC
5. Análisis y métricas"
                  rows={8}
                  className={errors.structure ? "border-red-500" : warnings.structure ? "border-yellow-500" : ""}
                />
                {errors.structure && <p className="text-red-500 text-sm mt-1">{errors.structure}</p>}
                {warnings.structure && !errors.structure && (
                  <p className="text-yellow-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> {warnings.structure}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">{editedData.structure?.split("\n").length || 0} módulos</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Consejos para una buena estructura</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                  <li>Organiza los módulos en orden lógico de progresión</li>
                  <li>Incluye entre 4 y 8 módulos para un curso estándar</li>
                  <li>Usa títulos descriptivos pero concisos</li>
                  <li>Considera incluir un módulo introductorio y uno de cierre/evaluación</li>
                </ul>
              </div>
            </TabsContent>

            {/* Evaluation Tab */}
            <TabsContent value="evaluation" className="space-y-6">
              <div>
                <Label htmlFor="evaluationMethod" className="text-base font-medium">
                  ¿Cómo evaluarás el aprendizaje? <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="evaluationMethod"
                  value={editedData.evaluationMethod || ""}
                  onChange={(e) => updateField("evaluationMethod", e.target.value)}
                  placeholder="Ej: A través de un proyecto final donde los participantes diseñarán una campaña de marketing digital"
                  rows={4}
                  className={
                    errors.evaluationMethod ? "border-red-500" : warnings.evaluationMethod ? "border-yellow-500" : ""
                  }
                  maxLength={CHAR_LIMITS.evaluationMethod}
                />
                {errors.evaluationMethod && <p className="text-red-500 text-sm mt-1">{errors.evaluationMethod}</p>}
                {warnings.evaluationMethod && !errors.evaluationMethod && (
                  <p className="text-yellow-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> {warnings.evaluationMethod}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {editedData.evaluationMethod?.length || 0}/{CHAR_LIMITS.evaluationMethod} caracteres
                </p>
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">Tipo de evaluación</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div
                    className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => updateField("evaluationType", "manual")}
                  >
                    <input
                      type="radio"
                      id="manual"
                      checked={editedData.evaluationType === "manual"}
                      onChange={() => updateField("evaluationType", "manual")}
                    />
                    <Label htmlFor="manual" className="font-normal cursor-pointer">
                      Manual (revisada por instructor)
                    </Label>
                  </div>
                  <div
                    className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => updateField("evaluationType", "automatica")}
                  >
                    <input
                      type="radio"
                      id="automatica"
                      checked={editedData.evaluationType === "automatica"}
                      onChange={() => updateField("evaluationType", "automatica")}
                    />
                    <Label htmlFor="automatica" className="font-normal cursor-pointer">
                      Automática (cuestionarios, tests)
                    </Label>
                  </div>
                  <div
                    className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => updateField("evaluationType", "mixta")}
                  >
                    <input
                      type="radio"
                      id="mixta"
                      checked={editedData.evaluationType === "mixta" || !editedData.evaluationType}
                      onChange={() => updateField("evaluationType", "mixta")}
                    />
                    <Label htmlFor="mixta" className="font-normal cursor-pointer">
                      Mixta (combinación de ambas)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 border rounded p-4">
                <input
                  type="checkbox"
                  id="certificate"
                  checked={editedData.certificate || false}
                  onChange={(e) => updateField("certificate", e.target.checked)}
                  className="h-4 w-4"
                />
                <div>
                  <Label htmlFor="certificate" className="text-base font-medium cursor-pointer">
                    ¿Se otorgará certificado?
                  </Label>
                  <p className="text-sm text-gray-500">
                    Los participantes recibirán un certificado al completar el curso
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <div>
                <Label htmlFor="materials" className="text-base font-medium">
                  Materiales necesarios
                </Label>
                <p className="text-sm text-gray-500 mb-2">
                  Lista los materiales que utilizarás para impartir el curso (uno por línea)
                </p>
                <Textarea
                  id="materials"
                  value={editedData.materials || ""}
                  onChange={(e) => updateField("materials", e.target.value)}
                  placeholder="Ej:
- Presentaciones de diapositivas
- Guías de ejercicios prácticos
- Videos tutoriales
- Plantillas de trabajo"
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2 border rounded p-4">
                <input
                  type="checkbox"
                  id="additionalMaterials"
                  checked={editedData.additionalMaterials || false}
                  onChange={(e) => updateField("additionalMaterials", e.target.checked)}
                  className="h-4 w-4"
                />
                <div>
                  <Label htmlFor="additionalMaterials" className="text-base font-medium cursor-pointer">
                    ¿Incluir materiales adicionales?
                  </Label>
                  <p className="text-sm text-gray-500">
                    La IA generará una lista de recursos complementarios recomendados
                  </p>
                </div>
              </div>

              {editedData.additionalMaterialsContent && (
                <div>
                  <Label htmlFor="additionalMaterialsContent" className="text-base font-medium">
                    Contenido de materiales adicionales
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Puedes editar el contenido de los materiales adicionales generados por la IA
                  </p>
                  <Textarea
                    id="additionalMaterialsContent"
                    value={editedData.additionalMaterialsContent || ""}
                    onChange={(e) => updateField("additionalMaterialsContent", e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Usa formato Markdown para organizar el contenido (## para títulos, - para listas)
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

