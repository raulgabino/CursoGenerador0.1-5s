"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BookOpen, Plus, Trash2, Edit2, Check, X, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import type { CourseData, CourseModule } from "@/types/course"
import { generateCourseStructure, generateMaterialSuggestions } from "@/app/actions/suggestion-actions"
import { getExpertContextForCourse } from "@/app/actions/context-actions"

interface ContentScreenProps {
  courseData: CourseData
  updateCourseData: (data: Partial<CourseData>) => void
  onNext: () => void
  onPrev: () => void
}

export default function ContentScreen({ courseData, updateCourseData, onNext, onPrev }: ContentScreenProps) {
  // Inicializar modules con un array vacío si structure no existe o no es un array
  const [modules, setModules] = useState<CourseModule[]>(() => {
    if (Array.isArray(courseData.structure)) {
      return courseData.structure
    }
    return []
  })

  const [materials, setMaterials] = useState<string>(courseData.materials || "")
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false)
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false)
  const [editingModule, setEditingModule] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Auto-save modules to courseData when they change
  useEffect(() => {
    console.log("🔍 DIAGNÓSTICO - ContentScreen actualizando structure:", modules)
    updateCourseData({ structure: modules })
  }, [modules, updateCourseData])

  // Auto-save materials to courseData when they change
  useEffect(() => {
    updateCourseData({ materials })
  }, [materials, updateCourseData])

  const handleGenerateStructure = async () => {
    if (!courseData.title) {
      setError("Se requiere un título del curso para generar la estructura")
      return
    }

    setIsGeneratingStructure(true)
    setError(null)

    try {
      console.log("🔍 DIAGNÓSTICO - Generando estructura para:", courseData.title)

      // Primero obtener el contexto de los expertos
      let theoreticalContext = ""
      let practicalContext = ""

      try {
        const expertContext = await getExpertContextForCourse(courseData)
        theoreticalContext = expertContext.theoreticalContext
        practicalContext = expertContext.practicalContext

        // Actualizar courseData con el contexto
        updateCourseData({
          theoreticalContext,
          practicalContext,
        })
      } catch (contextError) {
        console.warn("No se pudo obtener contexto de expertos, continuando sin él:", contextError)
      }

      // Generar estructura con el contexto disponible
      const structureResult = await generateCourseStructure({
        ...courseData,
        theoreticalContext,
        practicalContext,
      })

      if (Array.isArray(structureResult)) {
        console.log("🔍 DIAGNÓSTICO - Estructura generada:", structureResult)
        setModules(structureResult)
      } else if (structureResult.error) {
        setError(structureResult.error)
      }
    } catch (error: any) {
      console.error("Error generando estructura:", error)
      setError(`Error al generar estructura: ${error.message || "Error desconocido"}`)
    } finally {
      setIsGeneratingStructure(false)
    }
  }

  const handleGenerateMaterials = async () => {
    if (!courseData.title) {
      setError("Se requiere un título del curso para generar materiales")
      return
    }

    setIsGeneratingMaterials(true)
    setError(null)

    try {
      // Usar el contexto existente o generar uno nuevo si no existe
      let theoreticalContext = courseData.theoreticalContext || ""
      let practicalContext = courseData.practicalContext || ""

      if (!theoreticalContext || !practicalContext) {
        try {
          const expertContext = await getExpertContextForCourse(courseData)
          theoreticalContext = expertContext.theoreticalContext
          practicalContext = expertContext.practicalContext

          updateCourseData({
            theoreticalContext,
            practicalContext,
          })
        } catch (contextError) {
          console.warn("No se pudo obtener contexto de expertos para materiales:", contextError)
        }
      }

      const materialsResult = await generateMaterialSuggestions(
        { ...courseData, structure: modules },
        { theoreticalContext, practicalContext },
      )

      setMaterials(materialsResult)
    } catch (error: any) {
      console.error("Error generando materiales:", error)
      setError(`Error al generar materiales: ${error.message || "Error desconocido"}`)
    } finally {
      setIsGeneratingMaterials(false)
    }
  }

  const addModule = () => {
    const newModule: CourseModule = {
      moduleName: `Módulo ${modules.length + 1}`,
      moduleDescription: "Descripción del módulo...",
    }
    setModules([...modules, newModule])
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const startEditing = (index: number) => {
    setEditingModule(index)
    setEditName(modules[index].moduleName)
    setEditDescription(modules[index].moduleDescription)
  }

  const saveEdit = () => {
    if (editingModule !== null) {
      const updatedModules = [...modules]
      updatedModules[editingModule] = {
        moduleName: editName,
        moduleDescription: editDescription,
      }
      setModules(updatedModules)
      setEditingModule(null)
      setEditName("")
      setEditDescription("")
    }
  }

  const cancelEdit = () => {
    setEditingModule(null)
    setEditName("")
    setEditDescription("")
  }

  const validateForm = () => {
    if (modules.length === 0) {
      setError("Debes tener al menos un módulo en tu curso")
      return false
    }

    for (const module of modules) {
      if (!module.moduleName.trim() || !module.moduleDescription.trim()) {
        setError("Todos los módulos deben tener nombre y descripción")
        return false
      }
    }

    setError(null)
    return true
  }

  const handleNext = () => {
    console.log("🔍 DIAGNÓSTICO - ContentScreen handleNext llamado")
    console.log("🔍 DIAGNÓSTICO - modules:", modules)

    if (validateForm()) {
      console.log("🔍 DIAGNÓSTICO - Validación exitosa, llamando onNext")
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
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Paso 2: Organiza el contenido</h2>
        <p className="text-gray-600">
          Define la estructura de módulos de tu curso y los materiales necesarios para cada uno.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Course Structure Section */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-700">Estructura del curso</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateStructure}
                disabled={isGeneratingStructure || !courseData.title}
                className="bg-transparent"
              >
                {isGeneratingStructure ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar con IA
                  </>
                )}
              </Button>
              <Button onClick={addModule} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Añadir módulo
              </Button>
            </div>
          </div>

          {modules.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay módulos definidos</h3>
                <p className="text-gray-500 text-center mb-4">
                  Comienza añadiendo módulos manualmente o genera una estructura automáticamente con IA
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleGenerateStructure} disabled={isGeneratingStructure || !courseData.title}>
                    {isGeneratingStructure ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando estructura...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generar estructura con IA
                      </>
                    )}
                  </Button>
                  <Button onClick={addModule} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir módulo manualmente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <Card key={index} className="w-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      {editingModule === index ? (
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre del módulo</label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nombre del módulo"
                              className="font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Descripción del módulo
                            </label>
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Descripción detallada del módulo"
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={saveEdit} size="sm" variant="default">
                              <Check className="h-4 w-4 mr-1" />
                              Guardar
                            </Button>
                            <Button onClick={cancelEdit} size="sm" variant="outline">
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <CardTitle className="text-lg text-blue-800">{module.moduleName}</CardTitle>
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{module.moduleDescription}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => startEditing(index)} size="sm" variant="outline">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => removeModule(index)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Materials Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-700">Materiales y recursos</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateMaterials}
              disabled={isGeneratingMaterials || !courseData.title}
              className="bg-transparent"
            >
              {isGeneratingMaterials ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Sugerir con IA
                </>
              )}
            </Button>
          </div>

          <Textarea
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="Lista los materiales, recursos y herramientas necesarios para el curso..."
            rows={6}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-2">
            Incluye presentaciones, documentos, videos, herramientas, plataformas, etc.
          </p>
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
