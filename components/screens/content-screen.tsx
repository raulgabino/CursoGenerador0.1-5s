"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Plus, Trash2, Edit3, Save, X } from "lucide-react"
import { generateCourseStructure, generateMaterialSuggestions } from "@/app/actions/suggestion-actions"
import type { CourseData, CourseModule } from "@/types/course"

interface ContentScreenProps {
  courseData: CourseData
  onNext: () => void
  onBack: () => void
  onUpdateCourseData: (data: Partial<CourseData>) => void
}

export default function ContentScreen({ courseData, onNext, onBack, onUpdateCourseData }: ContentScreenProps) {
  // Estados para módulos
  const [modules, setModules] = useState<CourseModule[]>([])
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)

  // Estados para materiales
  const [materials, setMaterials] = useState<string[]>([])
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)

  // Estados para edición
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<number | null>(null)
  const [newMaterialText, setNewMaterialText] = useState("")

  // Inicializar módulos desde courseData
  useEffect(() => {
    console.log("🔍 DIAGNÓSTICO - Inicializando ContentScreen...")
    console.log("📋 courseData recibido:", courseData)
    console.log("🏗️ courseData.structure tipo:", typeof courseData.structure)
    console.log("🏗️ courseData.structure valor:", courseData.structure)

    if (courseData.structure) {
      if (Array.isArray(courseData.structure)) {
        console.log("✅ courseData.structure es array, longitud:", courseData.structure.length)
        setModules(courseData.structure)
      } else if (typeof courseData.structure === "string") {
        console.log("⚠️ courseData.structure es string, convirtiendo...")
        try {
          const parsedStructure = JSON.parse(courseData.structure)
          if (Array.isArray(parsedStructure)) {
            setModules(parsedStructure)
          } else {
            console.error("❌ Estructura parseada no es array")
            setModules([])
          }
        } catch (error) {
          console.error("❌ Error al parsear estructura:", error)
          setModules([])
        }
      } else {
        console.log("⚠️ courseData.structure no es array ni string, inicializando vacío")
        setModules([])
      }
    } else {
      console.log("ℹ️ No hay estructura previa, inicializando vacío")
      setModules([])
    }

    // Inicializar materiales
    if (courseData.materials && Array.isArray(courseData.materials)) {
      setMaterials(courseData.materials)
    } else {
      setMaterials([])
    }
  }, [courseData])

  // Actualizar courseData cuando cambien los módulos
  useEffect(() => {
    console.log("🔄 Actualizando courseData con nuevos módulos:", modules.length)
    onUpdateCourseData({
      structure: modules,
      materials: materials,
    })
  }, [modules, materials, onUpdateCourseData])

  const handleGenerateStructure = async () => {
    console.log("🚀 Iniciando generación de estructura...")
    setIsGeneratingStructure(true)
    setStructureError(null)

    try {
      console.log("📤 Enviando datos a generateCourseStructure:", courseData)
      const structureResult = await generateCourseStructure(courseData)

      console.log("📥 Resultado recibido:", structureResult)
      console.log("🔍 Tipo de resultado:", typeof structureResult)
      console.log("🔍 Es array:", Array.isArray(structureResult))

      // Verificar si es un error
      if (structureResult && typeof structureResult === "object" && "error" in structureResult) {
        console.error("❌ Error en la respuesta:", structureResult.error)
        setStructureError(structureResult.error)
        return
      }

      // Verificar si es un array válido
      if (Array.isArray(structureResult)) {
        console.log("✅ Estructura generada exitosamente, módulos:", structureResult.length)
        setModules(structureResult)
        setStructureError(null)
      } else {
        console.error("❌ Respuesta no es un array válido:", structureResult)
        setStructureError("La respuesta del servicio no tiene el formato esperado")
      }
    } catch (error: any) {
      console.error("❌ Error al generar estructura:", error)
      setStructureError(error.message || "Error desconocido al generar la estructura")
    } finally {
      setIsGeneratingStructure(false)
    }
  }

  const handleGenerateMaterials = async () => {
    if (modules.length === 0) {
      setMaterialsError("Primero debes tener módulos definidos para generar materiales")
      return
    }

    setIsGeneratingMaterials(true)
    setMaterialsError(null)

    try {
      const materialsResult = await generateMaterialSuggestions(courseData, modules)

      if (materialsResult && typeof materialsResult === "object" && "error" in materialsResult) {
        setMaterialsError(materialsResult.error)
        return
      }

      if (Array.isArray(materialsResult)) {
        setMaterials(materialsResult)
        setMaterialsError(null)
      } else {
        setMaterialsError("Error en el formato de respuesta de materiales")
      }
    } catch (error: any) {
      console.error("Error al generar materiales:", error)
      setMaterialsError(error.message || "Error desconocido al generar materiales")
    } finally {
      setIsGeneratingMaterials(false)
    }
  }

  const handleAddModule = () => {
    const newModule: CourseModule = {
      id: `modulo-${modules.length + 1}`,
      title: `Módulo ${modules.length + 1}`,
      description: "Descripción del módulo",
      duration: "2 horas",
      objectives: ["Objetivo principal"],
      topics: ["Tema principal"],
    }
    setModules([...modules, newModule])
  }

  const handleDeleteModule = (moduleId: string) => {
    setModules(modules.filter((m) => m.id !== moduleId))
  }

  const handleEditModule = (moduleId: string, field: keyof CourseModule, value: any) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m)))
  }

  const handleAddMaterial = () => {
    if (newMaterialText.trim()) {
      setMaterials([...materials, newMaterialText.trim()])
      setNewMaterialText("")
    }
  }

  const handleDeleteMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  const handleEditMaterial = (index: number, newValue: string) => {
    setMaterials(materials.map((material, i) => (i === index ? newValue : material)))
    setEditingMaterial(null)
  }

  const canProceed = modules.length > 0

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-blue-600">Paso 2: Organiza el contenido</h1>
        <p className="text-gray-600">
          Define la estructura de módulos de tu curso y los materiales necesarios para cada uno.
        </p>
      </div>

      {/* Errores de estructura */}
      {structureError && (
        <Alert variant="destructive">
          <AlertDescription>Error al generar estructura: {structureError}</AlertDescription>
        </Alert>
      )}

      {/* Sección de Estructura del Curso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-blue-600">Estructura del curso</CardTitle>
              <CardDescription>Define los módulos que conformarán tu curso</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateStructure} disabled={isGeneratingStructure} variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                {isGeneratingStructure ? "Generando..." : "Generar con IA"}
              </Button>
              <Button onClick={handleAddModule} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Añadir módulo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay módulos definidos</h3>
              <p className="text-gray-500 mb-6">
                Comienza añadiendo módulos manualmente o genera una estructura automáticamente con IA
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleGenerateStructure}
                  disabled={isGeneratingStructure}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingStructure ? "Generando..." : "Generar estructura con IA"}
                </Button>
                <Button onClick={handleAddModule} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir módulo manualmente
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <Card key={module.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingModule === module.id ? (
                          <div className="space-y-2">
                            <Input
                              value={module.title}
                              onChange={(e) => handleEditModule(module.id, "title", e.target.value)}
                              className="font-semibold"
                            />
                            <Textarea
                              value={module.description}
                              onChange={(e) => handleEditModule(module.id, "description", e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Input
                                value={module.duration}
                                onChange={(e) => handleEditModule(module.id, "duration", e.target.value)}
                                placeholder="Duración"
                                className="w-32"
                              />
                              <Button onClick={() => setEditingModule(null)} size="sm" variant="outline">
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{module.title}</h3>
                              <Badge variant="secondary">{module.duration}</Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-medium text-sm text-gray-700 mb-1">Objetivos:</h4>
                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                  {module.objectives.map((obj, i) => (
                                    <li key={i}>{obj}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-gray-700 mb-1">Temas:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {module.topics.map((topic, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          onClick={() => setEditingModule(editingModule === module.id ? null : module.id)}
                          size="sm"
                          variant="ghost"
                        >
                          {editingModule === module.id ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        </Button>
                        <Button
                          onClick={() => handleDeleteModule(module.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de Materiales y Recursos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-blue-600">Materiales y recursos</CardTitle>
              <CardDescription>Lista los materiales, recursos y herramientas necesarios para el curso</CardDescription>
            </div>
            <Button
              onClick={handleGenerateMaterials}
              disabled={isGeneratingMaterials || modules.length === 0}
              variant="outline"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGeneratingMaterials ? "Sugiriendo..." : "Sugerir con IA"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {materialsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{materialsError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Textarea
              placeholder="Lista los materiales, recursos y herramientas necesarios para el curso..."
              value={materials.join("\n")}
              onChange={(e) => setMaterials(e.target.value.split("\n").filter((line) => line.trim()))}
              rows={8}
              className="w-full"
            />

            <p className="text-sm text-gray-500">
              Incluye presentaciones, documentos, videos, herramientas, plataformas, etc.
            </p>

            {materials.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Materiales definidos ({materials.length}):</h4>
                <div className="space-y-1">
                  {materials.map((material, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      {editingMaterial === index ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={material}
                            onChange={(e) => handleEditMaterial(index, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setEditingMaterial(null)
                              }
                            }}
                            autoFocus
                          />
                          <Button onClick={() => setEditingMaterial(null)} size="sm" variant="outline">
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm">{material}</span>
                          <Button onClick={() => setEditingMaterial(index)} size="sm" variant="ghost">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteMaterial(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex justify-between pt-6">
        <Button onClick={onBack} variant="outline">
          Anterior
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="bg-blue-600 hover:bg-blue-700">
          Continuar
          {!canProceed && <span className="ml-2 text-xs opacity-75">(Añade al menos un módulo)</span>}
        </Button>
      </div>
    </div>
  )
}
