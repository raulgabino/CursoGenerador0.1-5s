"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Loader2, Sparkles, BookOpen, Plus, Trash2 } from "lucide-react"
import type { CourseData, CourseModule } from "@/types/course"
import { generateCourseStructure, generateMaterialSuggestions } from "@/app/actions/suggestion-actions"
import { getExpertContextForCourse } from "@/app/actions/context-actions"
import { getAndSummarizeSources } from "@/app/actions/source-actions"

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
  const [loadingSources, setLoadingSources] = useState<Record<number, boolean>>({})
  const [sourceResults, setSourceResults] = useState<Record<number, string>>({})

  // Inicializar estructura como array vacío si no existe
  const modules = courseData.structure || []

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!modules.length) {
      newErrors.structure = "La estructura del curso es obligatoria. Genera módulos con IA o añade manualmente."
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
      let expertContext

      // Verificar si el contexto de los expertos ya existe
      if (courseData.theoreticalContext && courseData.practicalContext) {
        // Si ya existe, usar el contexto almacenado
        expertContext = {
          theoreticalContext: courseData.theoreticalContext,
          practicalContext: courseData.practicalContext,
        }
      } else {
        // Si no existe, generar nuevo contexto y almacenarlo
        expertContext = await getExpertContextForCourse({ title: courseData.title })

        // Actualizar el estado principal con el contexto generado
        updateCourseData(expertContext)
      }

      // Generar la estructura usando el contexto (existente o recién generado)
      const structureResult = await generateCourseStructure({
        ...courseData,
        ...expertContext,
      })

      if ("error" in structureResult) {
        setAiError(structureResult.error)
      } else {
        // Actualizar con el array de módulos
        updateCourseData({ structure: structureResult })
      }
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
      // Verificar si el contexto de los expertos existe
      if (!courseData.theoreticalContext || !courseData.practicalContext) {
        alert(
          "Por favor, genera primero la estructura del curso. Esto creará el contexto necesario para sugerir materiales relevantes.",
        )
        return
      }

      // Si el contexto existe, proceder con la generación de materiales
      const materialsSuggestion = await generateMaterialSuggestions(courseData, {
        theoreticalContext: courseData.theoreticalContext,
        practicalContext: courseData.practicalContext,
      })

      updateCourseData({ materials: materialsSuggestion })
    } catch (error: any) {
      console.error("Error generating materials:", error)
      setAiError(`Error al generar materiales: ${error.message || "Error desconocido"}`)
    } finally {
      setIsGeneratingMaterials(false)
    }
  }

  const handleFindSources = async (moduleIndex: number, module: CourseModule) => {
    // Activar el estado de carga para este módulo específico
    setLoadingSources((prev) => ({ ...prev, [moduleIndex]: true }))
    // Limpiar resultados anteriores para este módulo
    setSourceResults((prev) => ({ ...prev, [moduleIndex]: "" }))

    // Crear consulta enriquecida con contexto completo
    const searchQuery = `${courseData.title}: ${module.moduleName} - ${module.moduleDescription}`

    const result = await getAndSummarizeSources(searchQuery)
    if (typeof result === "object" && result.error) {
      setSourceResults((prev) => ({ ...prev, [moduleIndex]: `Error: ${result.error}` }))
    } else if (typeof result === "string") {
      setSourceResults((prev) => ({ ...prev, [moduleIndex]: result }))
    }
    // Desactivar el estado de carga para este módulo
    setLoadingSources((prev) => ({ ...prev, [moduleIndex]: false }))
  }

  const handleAddModule = () => {
    const newModule: CourseModule = {
      moduleName: "Nuevo Módulo",
      moduleDescription: "Descripción del módulo",
    }
    updateCourseData({
      structure: [...modules, newModule],
    })
  }

  const handleUpdateModule = (index: number, updatedModule: CourseModule) => {
    const updatedModules = [...modules]
    updatedModules[index] = updatedModule
    updateCourseData({ structure: updatedModules })
  }

  const handleDeleteModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index)
    updateCourseData({ structure: updatedModules })
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <Label className="text-base font-medium">
                Estructura del curso <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-500 mt-1">Define los módulos principales de tu curso</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddModule}
                className="flex items-center gap-1 bg-transparent"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir Módulo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateStructure}
                disabled={isGeneratingStructure || !courseData.title}
                className="flex items-center gap-1 bg-transparent"
              >
                {isGeneratingStructure ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
          </div>

          {errors.structure && <p className="text-red-500 text-sm mb-4">{errors.structure}</p>}

          {/* Renderizado de módulos como objetos estructurados */}
          {modules.length > 0 && (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <Card key={index} className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-blue-800 mb-2">Módulo {index + 1}</CardTitle>
                        <input
                          type="text"
                          value={module.moduleName}
                          onChange={(e) =>
                            handleUpdateModule(index, {
                              ...module,
                              moduleName: e.target.value,
                            })
                          }
                          className="w-full text-base font-medium bg-transparent border-none outline-none focus:bg-gray-50 rounded px-2 py-1"
                          placeholder="Nombre del módulo"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModule(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Descripción del módulo</Label>
                        <Textarea
                          value={module.moduleDescription}
                          onChange={(e) =>
                            handleUpdateModule(index, {
                              ...module,
                              moduleDescription: e.target.value,
                            })
                          }
                          placeholder="Describe qué aprenderán los estudiantes en este módulo..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFindSources(index, module)}
                          disabled={loadingSources[index]}
                          className="transition-all duration-150"
                        >
                          {loadingSources[index] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <BookOpen className="mr-2 h-4 w-4" />
                          )}
                          Buscar Fuentes Académicas
                        </Button>
                      </div>

                      {/* Área de Resultados de Fuentes */}
                      {sourceResults[index] && (
                        <div className="mt-4 rounded-md border border-gray-300 bg-gray-50 p-4 text-sm">
                          <h4 className="font-semibold mb-2 text-gray-800">Fuentes Académicas Sugeridas:</h4>
                          <div
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: sourceResults[index].replace(/\n/g, "<br />") }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {modules.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">No hay módulos definidos</p>
              <p className="text-sm text-gray-400">Usa "Generar con IA" o "Añadir Módulo" para comenzar</p>
            </div>
          )}
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
              className="flex items-center gap-1 bg-transparent"
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
