"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Plus, Trash2, AlertCircle } from "lucide-react"
import { generateCourseStructure, generateMaterialSuggestions } from "@/app/actions/suggestion-actions"
import type { CourseData, CourseModule } from "@/types/course"

interface ContentScreenProps {
  courseData: CourseData
  onUpdate: (data: Partial<CourseData>) => void
  onNext: () => void
  onBack: () => void
}

export default function ContentScreen({ courseData, onUpdate, onNext, onBack }: ContentScreenProps) {
  // Inicializar modules con verificación de tipo segura
  const [modules, setModules] = useState<CourseModule[]>(() => {
    if (Array.isArray(courseData.structure)) {
      return courseData.structure
    }
    return []
  })

  const [materials, setMaterials] = useState(courseData.materials || "")
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false)
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)
  const [materialsError, setMaterialsError] = useState<string | null>(null)

  // Actualizar courseData cuando cambien los módulos o materiales
  useEffect(() => {
    onUpdate({
      structure: modules,
      materials: materials,
    })
  }, [modules, materials, onUpdate])

  const handleGenerateStructure = async () => {
    console.log("🔍 DIAGNÓSTICO - Iniciando generación de estructura...")
    setIsGeneratingStructure(true)
    setStructureError(null)

    try {
      console.log("🔍 DIAGNÓSTICO - Datos del curso:", {
        title: courseData.title,
        hasTheoreticalContext: !!courseData.theoreticalContext,
        hasPracticalContext: !!courseData.practicalContext,
      })

      const structureResult = await generateCourseStructure(courseData)

      console.log("🔍 DIAGNÓSTICO - Resultado recibido:", {
        type: typeof structureResult,
        isArray: Array.isArray(structureResult),
        hasError: structureResult && typeof structureResult === "object" && "error" in structureResult,
        result: structureResult,
      })

      // Verificación robusta del tipo de resultado
      if (!structureResult) {
        console.error("🔍 DIAGNÓSTICO - structureResult es null/undefined")
        setStructureError("No se recibió respuesta del servicio de IA")
        return
      }

      if (Array.isArray(structureResult)) {
        console.log("🔍 DIAGNÓSTICO - Estructura generada exitosamente:", structureResult.length, "módulos")
        setModules(structureResult)
        setStructureError(null)
      } else if (typeof structureResult === "object" && "error" in structureResult) {
        console.error("🔍 DIAGNÓSTICO - Error en la respuesta:", structureResult.error)
        setStructureError(structureResult.error)
      } else {
        console.error("🔍 DIAGNÓSTICO - Formato de respuesta inesperado:", structureResult)
        setStructureError("Formato de respuesta inesperado del servicio de IA")
      }
    } catch (error: any) {
      console.error("🔍 DIAGNÓSTICO - Error en handleGenerateStructure:", error)
      const errorMessage = error?.message || error?.toString() || "Error desconocido"
      setStructureError(`Error al generar estructura: ${errorMessage}`)
    } finally {
      setIsGeneratingStructure(false)
    }
  }

  const handleGenerateMaterials = async () => {
    setIsGeneratingMaterials(true)
    setMaterialsError(null)

    try {
      const suggestions = await generateMaterialSuggestions(courseData, {
        theoreticalContext: courseData.theoreticalContext || "",
        practicalContext: courseData.practicalContext || "",
      })

      setMaterials(suggestions)
      setMaterialsError(null)
    } catch (error: any) {
      console.error("Error generating materials:", error)
      const errorMessage = error?.message || error?.toString() || "Error desconocido"
      setMaterialsError(`Error al generar materiales: ${errorMessage}`)
    } finally {
      setIsGeneratingMaterials(false)
    }
  }

  const addModule = () => {
    const newModule: CourseModule = {
      moduleName: "",
      moduleDescription: "",
    }
    setModules([...modules, newModule])
  }

  const updateModule = (index: number, field: keyof CourseModule, value: string) => {
    const updatedModules = modules.map((module, i) => (i === index ? { ...module, [field]: value } : module))
    setModules(updatedModules)
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const canProceed =
    modules.length > 0 &&
    modules.every((module) => module.moduleName.trim() !== "" && module.moduleDescription.trim() !== "")

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-blue-600 mb-2">Paso 2: Organiza el contenido</h2>
        <p className="text-gray-600">
          Define la estructura de módulos de tu curso y los materiales necesarios para cada uno.
        </p>
      </div>

      {/* Error de estructura */}
      {structureError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{structureError}</AlertDescription>
        </Alert>
      )}

      {/* Estructura del curso */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-blue-600">Estructura del curso</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateStructure}
              disabled={isGeneratingStructure || !courseData.title}
              variant="outline"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGeneratingStructure ? "Generando..." : "Generar con IA"}
            </Button>
            <Button onClick={addModule} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Añadir módulo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay módulos definidos</h3>
              <p className="text-gray-500 mb-6">
                Comienza añadiendo módulos manualmente o genera una estructura automáticamente con IA
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleGenerateStructure}
                  disabled={isGeneratingStructure || !courseData.title}
                  variant="default"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingStructure ? "Generando..." : "Generar estructura con IA"}
                </Button>
                <Button onClick={addModule} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir módulo manualmente
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Módulo {index + 1}</h4>
                    <Button
                      onClick={() => removeModule(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del módulo</label>
                      <Input
                        value={module.moduleName}
                        onChange={(e) => updateModule(index, "moduleName", e.target.value)}
                        placeholder="Ej: Introducción a los conceptos básicos"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del módulo</label>
                      <Textarea
                        value={module.moduleDescription}
                        onChange={(e) => updateModule(index, "moduleDescription", e.target.value)}
                        placeholder="Describe qué aprenderán los estudiantes en este módulo..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error de materiales */}
      {materialsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{materialsError}</AlertDescription>
        </Alert>
      )}

      {/* Materiales y recursos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-blue-600">Materiales y recursos</CardTitle>
          <Button
            onClick={handleGenerateMaterials}
            disabled={isGeneratingMaterials || !courseData.title}
            variant="outline"
            size="sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGeneratingMaterials ? "Generando..." : "Sugerir con IA"}
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="Lista los materiales, recursos y herramientas necesarios para el curso..."
            rows={8}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-2">
            Incluye presentaciones, documentos, videos, herramientas, plataformas, etc.
          </p>
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          Anterior
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
