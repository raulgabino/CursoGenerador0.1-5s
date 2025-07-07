"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Plus, Trash2, Edit3, Save, X } from "lucide-react"
import { generateCourseStructure, generateMaterialSuggestions } from "@/app/actions/suggestion-actions"
import type { CourseData, CourseModule } from "@/types/course"

interface ContentScreenProps {
  courseData: CourseData
  onUpdateCourseData: (data: Partial<CourseData>) => void
  onNext: () => void
  onBack: () => void
}

export default function ContentScreen({ courseData, onUpdateCourseData, onNext, onBack }: ContentScreenProps) {
  const [modules, setModules] = useState<CourseModule[]>([])
  const [materials, setMaterials] = useState("")
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false)
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingModuleData, setEditingModuleData] = useState<Partial<CourseModule>>({})

  // Inicializar módulos desde courseData
  useEffect(() => {
    console.log("🔍 ContentScreen - courseData recibido:", courseData)

    if (courseData.structure && Array.isArray(courseData.structure)) {
      console.log("✅ Inicializando módulos desde courseData.structure")
      setModules(courseData.structure)
    } else {
      console.log("⚠️ courseData.structure no es un array válido, inicializando vacío")
      setModules([])
    }

    if (courseData.materials) {
      setMaterials(courseData.materials)
    }
  }, [courseData])

  // Actualizar courseData cuando cambien los módulos o materiales
  useEffect(() => {
    onUpdateCourseData({
      structure: modules,
      materials: materials,
    })
  }, [modules, materials, onUpdateCourseData])

  const handleGenerateStructure = async () => {
    try {
      setIsGeneratingStructure(true)
      setError(null)

      console.log("🚀 Iniciando generación de estructura...")
      console.log("📋 Datos del curso para IA:", courseData)

      const result = await generateCourseStructure(courseData)

      console.log("📥 Resultado de generateCourseStructure:", result)
      console.log("📊 Tipo de resultado:", typeof result)
      console.log("📊 Es array:", Array.isArray(result))

      if (!result) {
        console.error("❌ Resultado es null/undefined")
        setError("No se recibió respuesta del servicio de IA")
        return
      }

      // Verificar si es un error
      if (typeof result === "object" && "error" in result && result.error) {
        console.error("❌ Error en la respuesta:", result.error)
        setError(result.error)
        return
      }

      // Verificar si es un array válido
      if (Array.isArray(result)) {
        console.log("✅ Estructura generada exitosamente:", result.length, "módulos")
        setModules(result)
        setError(null)
      } else {
        console.error("❌ Resultado no es un array:", result)
        setError("Formato de respuesta inválido del servicio de IA")
      }
    } catch (error: any) {
      console.error("❌ Error al generar estructura:", error)
      setError(`Error al generar estructura: ${error.message}`)
    } finally {
      setIsGeneratingStructure(false)
    }
  }

  const handleGenerateMaterials = async () => {
    try {
      setIsGeneratingMaterials(true)
      setError(null)

      const context = {
        theoreticalContext: courseData.theoreticalContext || "",
        practicalContext: courseData.practicalContext || "",
      }

      const result = await generateMaterialSuggestions(courseData, context)
      setMaterials(result)
    } catch (error: any) {
      console.error("Error al generar materiales:", error)
      setError(`Error al generar materiales: ${error.message}`)
    } finally {
      setIsGeneratingMaterials(false)
    }
  }

  const handleAddModule = () => {
    const newModule: CourseModule = {
      id: `modulo-${Date.now()}`,
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

  const handleEditModule = (module: CourseModule) => {
    setEditingModule(module.id)
    setEditingModuleData(module)
  }

  const handleSaveModule = () => {
    if (!editingModule) return

    setModules(modules.map((m) => (m.id === editingModule ? { ...m, ...editingModuleData } : m)))
    setEditingModule(null)
    setEditingModuleData({})
  }

  const handleCancelEdit = () => {
    setEditingModule(null)
    setEditingModuleData({})
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estructura del curso */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-blue-600">Estructura del curso</CardTitle>
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
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-gray-400 mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">📚</div>
              </div>
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
                  <CardContent className="p-4">
                    {editingModule === module.id ? (
                      <div className="space-y-4">
                        <Input
                          value={editingModuleData.title || ""}
                          onChange={(e) => setEditingModuleData({ ...editingModuleData, title: e.target.value })}
                          placeholder="Título del módulo"
                        />
                        <Textarea
                          value={editingModuleData.description || ""}
                          onChange={(e) => setEditingModuleData({ ...editingModuleData, description: e.target.value })}
                          placeholder="Descripción del módulo"
                          rows={3}
                        />
                        <Input
                          value={editingModuleData.duration || ""}
                          onChange={(e) => setEditingModuleData({ ...editingModuleData, duration: e.target.value })}
                          placeholder="Duración (ej: 2 horas)"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveModule} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                          </Button>
                          <Button onClick={handleCancelEdit} variant="outline" size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">Módulo {index + 1}</Badge>
                            <Badge variant="outline">{module.duration}</Badge>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                          <p className="text-gray-600 mb-3">{module.description}</p>
                          {module.objectives && module.objectives.length > 0 && (
                            <div className="mb-2">
                              <h4 className="font-medium text-sm text-gray-700 mb-1">Objetivos:</h4>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {module.objectives.map((objective, idx) => (
                                  <li key={idx}>{objective}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {module.topics && module.topics.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-1">Temas:</h4>
                              <div className="flex flex-wrap gap-1">
                                {module.topics.map((topic, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button onClick={() => handleEditModule(module)} variant="ghost" size="sm">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteModule(module.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materiales y recursos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-blue-600">Materiales y recursos</CardTitle>
          <Button onClick={handleGenerateMaterials} disabled={isGeneratingMaterials} variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            {isGeneratingMaterials ? "Generando..." : "Sugerir con IA"}
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="Lista los materiales, recursos y herramientas necesarios para el curso...

Incluye presentaciones, documentos, videos, herramientas, plataformas, etc."
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
        <Button onClick={onNext} disabled={!canProceed} className="bg-blue-600 hover:bg-blue-700">
          Continuar
        </Button>
      </div>
    </div>
  )
}
