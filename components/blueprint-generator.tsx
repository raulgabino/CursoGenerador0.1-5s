"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BookOpen, Target, CheckCircle, Users, Clock, Save, Plus, Trash2 } from "lucide-react"
import type { GenerateBlueprintRequest, CourseBlueprint, GenerateBlueprintResponse } from "@/types/course-blueprint"
import type {
  SaveBlueprintResponse,
  GetBlueprintResponse,
  CourseBlueprint_DB,
} from "@/types/course-blueprint-persistence"
import ModuleCard from "@/components/module-card"

export default function BlueprintGenerator() {
  const searchParams = useSearchParams()
  const blueprintId = searchParams?.get("id")

  // State management
  const [formData, setFormData] = useState<GenerateBlueprintRequest>({
    topic: "",
    audience: "",
    modality: "",
    totalHours: 0,
    prerequisites: "",
    availableResources: "",
    expectedResult: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [courseBlueprint, setCourseBlueprint] = useState<CourseBlueprint | null>(null)
  const [savedBlueprintData, setSavedBlueprintData] = useState<CourseBlueprint_DB | null>(null)
  const [moduleSourcesResults, setModuleSourcesResults] = useState<Record<number, string>>({})

  // Load existing blueprint if ID is provided
  useEffect(() => {
    if (blueprintId) {
      loadExistingBlueprint(blueprintId)
    }
  }, [blueprintId])

  // Load existing blueprint from API
  const loadExistingBlueprint = async (id: string) => {
    setIsLoadingBlueprint(true)
    setError("")

    try {
      console.log(`Loading existing blueprint: ${id}`)

      const response = await fetch(`/api/course/blueprint/${id}`)
      const result: GetBlueprintResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}: ${response.statusText}`)
      }

      if (result.success && result.data) {
        setCourseBlueprint(result.data.blueprintData)
        setSavedBlueprintData(result.data)
        console.log("Blueprint loaded successfully")
      } else {
        throw new Error(result.error || "Error desconocido al cargar el blueprint")
      }
    } catch (err) {
      console.error("Error loading blueprint:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al cargar el blueprint")
    } finally {
      setIsLoadingBlueprint(false)
    }
  }

  // Handle module sources found
  const handleModuleSourcesFound = (moduleIndex: number, sources: string) => {
    setModuleSourcesResults((prev) => ({
      ...prev,
      [moduleIndex]: sources,
    }))
  }

  // Handle form field changes
  const handleInputChange = (field: keyof GenerateBlueprintRequest, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle course title change
  const handleCourseTitleChange = (value: string) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      courseTitle: value,
    }))
  }

  // Handle learning outcomes changes
  const handleLearningOutcomeChange = (index: number, value: string) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      learningOutcomes: prev!.learningOutcomes.map((outcome, i) => (i === index ? value : outcome)),
    }))
  }

  const addLearningOutcome = () => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      learningOutcomes: [...prev!.learningOutcomes, "Nuevo objetivo de aprendizaje"],
    }))
  }

  const removeLearningOutcome = (index: number) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      learningOutcomes: prev!.learningOutcomes.filter((_, i) => i !== index),
    }))
  }

  // Handle module changes
  const handleModuleChange = (moduleIndex: number, field: keyof CourseBlueprint["modules"][0], value: any) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      modules: prev!.modules.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              [field]: value,
            }
          : module,
      ),
    }))
  }

  const handleModuleArrayChange = (
    moduleIndex: number,
    field: "moduleOutcomes" | "activities" | "assessments",
    itemIndex: number,
    value: string,
  ) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      modules: prev!.modules.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              [field]: module[field].map((item, j) => (j === itemIndex ? value : item)),
            }
          : module,
      ),
    }))
  }

  const addModuleArrayItem = (moduleIndex: number, field: "moduleOutcomes" | "activities" | "assessments") => {
    if (!courseBlueprint) return
    const newItem =
      field === "moduleOutcomes" ? "Nuevo objetivo" : field === "activities" ? "Nueva actividad" : "Nueva evaluación"

    setCourseBlueprint((prev) => ({
      ...prev!,
      modules: prev!.modules.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              [field]: [...module[field], newItem],
            }
          : module,
      ),
    }))
  }

  const removeModuleArrayItem = (
    moduleIndex: number,
    field: "moduleOutcomes" | "activities" | "assessments",
    itemIndex: number,
  ) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      modules: prev!.modules.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              [field]: module[field].filter((_, j) => j !== itemIndex),
            }
          : module,
      ),
    }))
  }

  // Handle prework changes
  const handlePreworkChange = (index: number, value: string) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      prework: prev!.prework.map((item, i) => (i === index ? value : item)),
    }))
  }

  const addPreworkItem = () => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      prework: [...prev!.prework, "Nueva tarea previa"],
    }))
  }

  const removePreworkItem = (index: number) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      prework: prev!.prework.filter((_, i) => i !== index),
    }))
  }

  // Handle required resources changes
  const handleRequiredResourceChange = (index: number, value: string) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      requiredResources: prev!.requiredResources.map((item, i) => (i === index ? value : item)),
    }))
  }

  const addRequiredResource = () => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      requiredResources: [...prev!.requiredResources, "Nuevo recurso requerido"],
    }))
  }

  const removeRequiredResource = (index: number) => {
    if (!courseBlueprint) return
    setCourseBlueprint((prev) => ({
      ...prev!,
      requiredResources: prev!.requiredResources.filter((_, i) => i !== index),
    }))
  }

  // Validate form data
  const validateForm = (): boolean => {
    const requiredFields: (keyof GenerateBlueprintRequest)[] = [
      "topic",
      "audience",
      "modality",
      "totalHours",
      "prerequisites",
      "availableResources",
      "expectedResult",
    ]

    for (const field of requiredFields) {
      const value = formData[field]
      if (!value || (typeof value === "string" && value.trim() === "")) {
        setError(`El campo ${field} es obligatorio`)
        return false
      }
    }

    if (formData.totalHours <= 0) {
      setError("Las horas totales deben ser mayor a 0")
      return false
    }

    return true
  }

  // Handle form submission (generate new blueprint)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")
    setCourseBlueprint(null)

    try {
      console.log("Sending request to generate blueprint...")

      const response = await fetch("/api/course/generate-blueprint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result: GenerateBlueprintResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}: ${response.statusText}`)
      }

      if (result.success && result.data) {
        setCourseBlueprint(result.data)
        setSavedBlueprintData(null) // Reset saved data for new blueprint
        console.log("Blueprint generated successfully")
      } else {
        throw new Error(result.error || "Error desconocido al generar el blueprint")
      }
    } catch (err) {
      console.error("Error generating blueprint:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al generar el blueprint")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle save progress
  const handleSave = async () => {
    if (!courseBlueprint) return

    setIsSaving(true)
    setSaveStatus("saving")
    setError("")

    try {
      const isUpdate = savedBlueprintData?.id

      if (isUpdate) {
        // Update existing blueprint
        console.log(`Updating blueprint: ${savedBlueprintData.id}`)

        const response = await fetch(`/api/course/blueprint/${savedBlueprintData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blueprintData: courseBlueprint,
          }),
        })

        const result: SaveBlueprintResponse = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Error ${response.status}: ${response.statusText}`)
        }

        if (result.success && result.data) {
          setSavedBlueprintData(result.data)
          setSaveStatus("saved")
          console.log(`Blueprint updated successfully to revision ${result.data.revision}`)
        } else {
          throw new Error(result.error || "Error desconocido al actualizar el blueprint")
        }
      } else {
        // Save new blueprint
        console.log("Saving new blueprint...")

        const response = await fetch("/api/course/save-blueprint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blueprintData: courseBlueprint,
          }),
        })

        const result: SaveBlueprintResponse = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Error ${response.status}: ${response.statusText}`)
        }

        if (result.success && result.data) {
          setSavedBlueprintData(result.data)
          setSaveStatus("saved")
          console.log(`Blueprint saved successfully with ID: ${result.data.id}`)

          // Update URL to include the new ID
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.set("id", result.data.id)
          window.history.replaceState({}, "", newUrl.toString())
        } else {
          throw new Error(result.error || "Error desconocido al guardar el blueprint")
        }
      }

      // Reset save status after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle")
      }, 2000)
    } catch (err) {
      console.error("Error saving blueprint:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al guardar el blueprint")
      setSaveStatus("error")

      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle")
      }, 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case "saving":
        return "Guardando..."
      case "saved":
        return "¡Guardado!"
      case "error":
        return "Error al guardar"
      default:
        return savedBlueprintData?.id ? "Actualizar Progreso" : "Guardar Progreso"
    }
  }

  const getSaveButtonIcon = () => {
    switch (saveStatus) {
      case "saving":
        return <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      case "saved":
        return <CheckCircle className="mr-2 h-5 w-5" />
      default:
        return <Save className="mr-2 h-5 w-5" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">
          {blueprintId ? "Editor de Blueprint de Curso" : "Generador de Blueprint de Cursos"}
        </h1>
        <p className="text-gray-600">
          {blueprintId
            ? "Edita y refina tu blueprint de curso existente"
            : "Utiliza IA para crear un blueprint estructurado de tu curso en minutos"}
        </p>
        {savedBlueprintData && (
          <p className="text-sm text-gray-500 mt-2">
            Revisión {savedBlueprintData.revision} • Última actualización:{" "}
            {new Date(savedBlueprintData.updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Loading existing blueprint */}
      {isLoadingBlueprint && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg text-gray-600">Cargando blueprint...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Section - Only show if not loading existing blueprint and no blueprint loaded */}
      {!isLoadingBlueprint && !courseBlueprint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Información del Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topic */}
                <div>
                  <Label htmlFor="topic" className="text-base font-medium">
                    Tema del Curso <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="topic"
                    type="text"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    placeholder="Ej: Introducción al Machine Learning"
                    className="mt-1"
                  />
                </div>

                {/* Audience */}
                <div>
                  <Label htmlFor="audience" className="text-base font-medium">
                    Audiencia Objetivo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="audience"
                    type="text"
                    value={formData.audience}
                    onChange={(e) => handleInputChange("audience", e.target.value)}
                    placeholder="Ej: Desarrolladores junior con experiencia en Python"
                    className="mt-1"
                  />
                </div>

                {/* Modality */}
                <div>
                  <Label htmlFor="modality" className="text-base font-medium">
                    Modalidad <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="modality"
                    value={formData.modality}
                    onChange={(e) => handleInputChange("modality", e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecciona una modalidad</option>
                    <option value="Presencial">Presencial</option>
                    <option value="En línea">En línea</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>

                {/* Total Hours */}
                <div>
                  <Label htmlFor="totalHours" className="text-base font-medium">
                    Horas Totales <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="totalHours"
                    type="number"
                    min="1"
                    value={formData.totalHours || ""}
                    onChange={(e) => handleInputChange("totalHours", Number.parseInt(e.target.value) || 0)}
                    placeholder="Ej: 16"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <Label htmlFor="prerequisites" className="text-base font-medium">
                  Prerrequisitos <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="prerequisites"
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange("prerequisites", e.target.value)}
                  placeholder="Describe los conocimientos previos necesarios..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Available Resources */}
              <div>
                <Label htmlFor="availableResources" className="text-base font-medium">
                  Recursos Disponibles <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="availableResources"
                  value={formData.availableResources}
                  onChange={(e) => handleInputChange("availableResources", e.target.value)}
                  placeholder="Describe los recursos que tienes disponibles para el curso..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Expected Result */}
              <div>
                <Label htmlFor="expectedResult" className="text-base font-medium">
                  Resultado Esperado <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="expectedResult"
                  value={formData.expectedResult}
                  onChange={(e) => handleInputChange("expectedResult", e.target.value)}
                  placeholder="Describe qué deberían ser capaces de hacer los participantes al finalizar..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generando Blueprint...
                    </>
                  ) : (
                    "Generar Blueprint del Curso"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Generando tu blueprint personalizado...</p>
                <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos momentos</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success State - Editable Blueprint */}
        {courseBlueprint && (
          <div className="space-y-6">
            {/* Save Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleSave}
                disabled={isSaving || !courseBlueprint}
                className={`px-8 py-3 text-lg ${
                  saveStatus === "saved"
                    ? "bg-green-600 hover:bg-green-700"
                    : saveStatus === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {getSaveButtonIcon()}
                {getSaveButtonText()}
              </Button>
            </div>

            {/* Course Title and Overview - Editable */}
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="courseTitle" className="text-base font-medium">
                      Título del Curso
                    </Label>
                    <Input
                      id="courseTitle"
                      type="text"
                      value={courseBlueprint.courseTitle}
                      onChange={(e) => handleCourseTitleChange(e.target.value)}
                      className="text-2xl font-bold text-blue-800 border-0 px-0 focus-visible:ring-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {courseBlueprint.totalHours} horas totales
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {courseBlueprint.modules.length} módulos
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Learning Outcomes - Editable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos de Aprendizaje del Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courseBlueprint.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-2 flex-shrink-0" />
                      <Textarea
                        value={outcome}
                        onChange={(e) => handleLearningOutcomeChange(index, e.target.value)}
                        className="flex-1 min-h-[60px] resize-none"
                        rows={2}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLearningOutcome(index)}
                        className="text-red-600 hover:text-red-700 mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addLearningOutcome} className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Objetivo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Modules with Academic Sources - Using ModuleCard Component */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-blue-800">Módulos del Curso</h2>
              <div className="grid gap-6">
                {courseBlueprint.modules.map((module, moduleIndex) => (
                  <ModuleCard
                    key={moduleIndex}
                    module={module}
                    moduleIndex={moduleIndex}
                    courseTitle={courseBlueprint.courseTitle}
                    onSourcesFound={handleModuleSourcesFound}
                  />
                ))}
              </div>
            </div>

            {/* Editable Modules Section - Keep the original editing interface */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-blue-800">Editor de Módulos</h2>
              {courseBlueprint.modules.map((module, moduleIndex) => (
                <Card key={moduleIndex}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label htmlFor={`module-${moduleIndex}-name`} className="text-sm font-medium">
                          Módulo {moduleIndex + 1}:
                        </Label>
                        <Input
                          id={`module-${moduleIndex}-name`}
                          value={module.moduleName}
                          onChange={(e) => handleModuleChange(moduleIndex, "moduleName", e.target.value)}
                          className="text-lg font-semibold"
                        />
                      </div>
                      <div className="w-32">
                        <Label htmlFor={`module-${moduleIndex}-hours`} className="text-sm font-medium">
                          Horas
                        </Label>
                        <Input
                          id={`module-${moduleIndex}-hours`}
                          type="number"
                          min="1"
                          value={module.moduleHours}
                          onChange={(e) =>
                            handleModuleChange(moduleIndex, "moduleHours", Number.parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Module Outcomes */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Objetivos del Módulo:</h4>
                      <div className="space-y-2">
                        {module.moduleOutcomes.map((outcome, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-2 flex-shrink-0" />
                            <Textarea
                              value={outcome}
                              onChange={(e) =>
                                handleModuleArrayChange(moduleIndex, "moduleOutcomes", idx, e.target.value)
                              }
                              className="flex-1 min-h-[50px] resize-none text-sm"
                              rows={2}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeModuleArrayItem(moduleIndex, "moduleOutcomes", idx)}
                              className="text-red-600 hover:text-red-700 mt-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addModuleArrayItem(moduleIndex, "moduleOutcomes")}
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Agregar Objetivo
                        </Button>
                      </div>
                    </div>

                    {/* Activities */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Actividades:</h4>
                      <div className="space-y-2">
                        {module.activities.map((activity, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-3 flex-shrink-0"></span>
                            <Textarea
                              value={activity}
                              onChange={(e) => handleModuleArrayChange(moduleIndex, "activities", idx, e.target.value)}
                              className="flex-1 min-h-[50px] resize-none text-sm"
                              rows={2}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeModuleArrayItem(moduleIndex, "activities", idx)}
                              className="text-red-600 hover:text-red-700 mt-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addModuleArrayItem(moduleIndex, "activities")}
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Agregar Actividad
                        </Button>
                      </div>
                    </div>

                    {/* Assessments */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Evaluaciones:</h4>
                      <div className="space-y-2">
                        {module.assessments.map((assessment, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-purple-600 rounded-full mt-3 flex-shrink-0"></span>
                            <Textarea
                              value={assessment}
                              onChange={(e) => handleModuleArrayChange(moduleIndex, "assessments", idx, e.target.value)}
                              className="flex-1 min-h-[50px] resize-none text-sm"
                              rows={2}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeModuleArrayItem(moduleIndex, "assessments", idx)}
                              className="text-red-600 hover:text-red-700 mt-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addModuleArrayItem(moduleIndex, "assessments")}
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Agregar Evaluación
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Prework and Resources - Editable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prework */}
              <Card>
                <CardHeader>
                  <CardTitle>Trabajo Previo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courseBlueprint.prework.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-orange-600 rounded-full mt-3 flex-shrink-0"></span>
                        <Textarea
                          value={item}
                          onChange={(e) => handlePreworkChange(index, e.target.value)}
                          className="flex-1 min-h-[50px] resize-none text-sm"
                          rows={2}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePreworkItem(index)}
                          className="text-red-600 hover:text-red-700 mt-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addPreworkItem} className="w-full bg-transparent">
                      <Plus className="h-3 w-3 mr-2" />
                      Agregar Tarea Previa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Required Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Recursos Requeridos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courseBlueprint.requiredResources.map((resource, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-gray-600 rounded-full mt-3 flex-shrink-0"></span>
                        <Textarea
                          value={resource}
                          onChange={(e) => handleRequiredResourceChange(index, e.target.value)}
                          className="flex-1 min-h-[50px] resize-none text-sm"
                          rows={2}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequiredResource(index)}
                          className="text-red-600 hover:text-red-700 mt-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addRequiredResource} className="w-full bg-transparent">
                      <Plus className="h-3 w-3 mr-2" />
                      Agregar Recurso
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Button at bottom */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleSave}
                disabled={isSaving || !courseBlueprint}
                className={`px-8 py-3 text-lg ${
                  saveStatus === "saved"
                    ? "bg-green-600 hover:bg-green-700"
                    : saveStatus === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {getSaveButtonIcon()}
                {getSaveButtonText()}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
