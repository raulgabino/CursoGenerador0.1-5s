"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Trash2, Edit3, Save, X, Sparkles, BookOpen } from "lucide-react"
import { generateCourseStructure, generateMaterialSuggestions } from "@/app/actions/suggestion-actions"
import type { CourseData, CourseModule } from "@/types/course"

interface ContentScreenProps {
  courseData: CourseData
  onNext: (data: Partial<CourseData>) => void
  onBack: () => void
}

export default function ContentScreen({ courseData, onNext, onBack }: ContentScreenProps) {
  // Estados para módulos
  const [modules, setModules] = useState<CourseModule[]>([])
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)

  // Estados para materiales
  const [materials, setMaterials] = useState<string>("")
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)

  // Estados para edición de módulos
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<CourseModule>>({})

  // Estados para nuevo módulo
  const [showAddModule, setShowAddModule] = useState(false)
  const [newModule, setNewModule] = useState<Partial<CourseModule>>({
    title: "",
    description: "",
    duration: "2 horas",
    objectives: [""],
    topics: [""],
  })

  // Inicializar módulos desde courseData
  useEffect(() => {
    console.log("🔍 ContentScreen - Inicializando con courseData:", courseData)

    if (courseData.structure && Array.isArray(courseData.structure)) {
      console.log("✅ Estructura encontrada:", courseData.structure.length, "módulos")
      setModules(courseData.structure)
    } else {
      console.log("⚠️ No hay estructura previa, iniciando con array vacío")
      setModules([])
    }

    // Inicializar materiales si existen
    if (courseData.materials && typeof courseData.materials === "string") {
      setMaterials(courseData.materials)
    }
  }, [courseData])

  // Generar estructura con IA
  const handleGenerateStructure = async () => {
    try {
      console.log("🤖 Iniciando generación de estructura con IA...")
      setIsGeneratingStructure(true)
      setStructureError(null)

      const result = await generateCourseStructure(courseData)
      console.log("📊 Resultado de generación:", result)

      if (result && typeof result === "object" && "error" in result) {
        console.error("❌ Error en generación:", result.error)
        setStructureError(result.error)
      } else if (Array.isArray(result)) {
        console.log("✅ Estructura generada exitosamente:", result.length, "módulos")
        setModules(result)
        setStructureError(null)
      } else {
        console.error("❌ Formato de respuesta inesperado:", typeof result)
        setStructureError("Formato de respuesta inesperado del servicio de IA")
      }
    } catch (error: any) {
      console.error("❌ Error al generar estructura:", error)
      setStructureError(error.message || "Error desconocido al generar estructura")
    } finally {
      setIsGeneratingStructure(false)
    }
  }

  // Generar sugerencias de materiales
  const handleGenerateMaterials = async () => {
    try {
      setIsGeneratingMaterials(true)
      setMaterialsError(null)

      const context = {
        theoreticalContext: courseData.theoreticalContext || "",
        practicalContext: courseData.practicalContext || "",
      }

      const suggestions = await generateMaterialSuggestions({ ...courseData, structure: modules }, context)

      if (typeof suggestions === "string") {
        setMaterials(suggestions)
      } else {
        setMaterialsError("Error al generar sugerencias de materiales")
      }
    } catch (error: any) {
      console.error("Error al generar materiales:", error)
      setMaterialsError(error.message || "Error desconocido")
    } finally {
      setIsGeneratingMaterials(false)
    }
  }

  // Añadir módulo manualmente
  const handleAddModule = () => {
    if (!newModule.title || !newModule.description) {
      return
    }

    const moduleToAdd: CourseModule = {
      id: `modulo-${Date.now()}`,
      title: newModule.title,
      description: newModule.description,
      duration: newModule.duration || "2 horas",
      objectives: newModule.objectives?.filter((obj) => obj.trim() !== "") || ["Objetivo principal"],
      topics: newModule.topics?.filter((topic) => topic.trim() !== "") || ["Tema principal"],
    }

    setModules((prev) => [...prev, moduleToAdd])
    setNewModule({
      title: "",
      description: "",
      duration: "2 horas",
      objectives: [""],
      topics: [""],
    })
    setShowAddModule(false)
  }

  // Eliminar módulo
  const handleDeleteModule = (moduleId: string) => {
    setModules((prev) => prev.filter((m) => m.id !== moduleId))
  }

  // Iniciar edición de módulo
  const handleEditModule = (module: CourseModule) => {
    setEditingModule(module.id)
    setEditingData({ ...module })
  }

  // Guardar edición de módulo
  const handleSaveModule = () => {
    if (!editingModule || !editingData.title || !editingData.description) {
      return
    }

    setModules((prev) =>
      prev.map((m) =>
        m.id === editingModule
          ? {
              ...m,
              ...editingData,
              objectives: editingData.objectives?.filter((obj) => obj.trim() !== "") || m.objectives,
              topics: editingData.topics?.filter((topic) => topic.trim() !== "") || m.topics,
            }
          : m,
      ),
    )

    setEditingModule(null)
    setEditingData({})
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingModule(null)
    setEditingData({})
  }

  // Continuar al siguiente paso
  const handleNext = () => {
    if (modules.length === 0) {
      setStructureError("Debes añadir al menos un módulo antes de continuar")
      return
    }

    const updatedCourseData = {
      structure: modules,
      materials: materials.trim() || undefined,
    }

    console.log("➡️ Avanzando al siguiente paso con:", updatedCourseData)
    onNext(updatedCourseData)
  }

  // Funciones auxiliares para edición de arrays
  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...(editingData.objectives || [])]
    newObjectives[index] = value
    setEditingData((prev) => ({ ...prev, objectives: newObjectives }))
  }

  const addObjective = () => {
    setEditingData((prev) => ({
      ...prev,
      objectives: [...(prev.objectives || []), ""],
    }))
  }

  const removeObjective = (index: number) => {
    setEditingData((prev) => ({
      ...prev,
      objectives: prev.objectives?.filter((_, i) => i !== index) || [],
    }))
  }

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...(editingData.topics || [])]
    newTopics[index] = value
    setEditingData((prev) => ({ ...prev, topics: newTopics }))
  }

  const addTopic = () => {
    setEditingData((prev) => ({
      ...prev,
      topics: [...(prev.topics || []), ""],
    }))
  }

  const removeTopic = (index: number) => {
    setEditingData((prev) => ({
      ...prev,
      topics: prev.topics?.filter((_, i) => i !== index) || [],
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-blue-600">Paso 2: Organiza el contenido</h1>
        <p className="text-gray-600">
          Define la estructura de módulos de tu curso y los materiales necesarios para cada uno.
        </p>
      </div>

      {/* Errores generales */}
      {structureError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">Error al generar estructura: {structureError}</AlertDescription>
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
              <Button
                onClick={handleGenerateStructure}
                disabled={isGeneratingStructure}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingStructure ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generar con IA
              </Button>
              <Button onClick={() => setShowAddModule(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Añadir módulo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay módulos definidos</h3>
              <p className="text-gray-500 mb-6">
                Comienza añadiendo módulos manualmente o genera una estructura automáticamente con IA
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleGenerateStructure}
                  disabled={isGeneratingStructure}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGeneratingStructure ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generar estructura con IA
                </Button>
                <Button onClick={() => setShowAddModule(true)} variant="outline">
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
                      // Modo edición
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">Editando módulo</h4>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveModule}>
                              <Save className="w-4 h-4 mr-1" />
                              Guardar
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Título</label>
                            <Input
                              value={editingData.title || ""}
                              onChange={(e) => setEditingData((prev) => ({ ...prev, title: e.target.value }))}
                              placeholder="Título del módulo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Duración</label>
                            <Input
                              value={editingData.duration || ""}
                              onChange={(e) => setEditingData((prev) => ({ ...prev, duration: e.target.value }))}
                              placeholder="ej: 2 horas"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Descripción</label>
                          <Textarea
                            value={editingData.description || ""}
                            onChange={(e) => setEditingData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Descripción del módulo"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Objetivos</label>
                          {editingData.objectives?.map((objective, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <Input
                                value={objective}
                                onChange={(e) => updateObjective(idx, e.target.value)}
                                placeholder="Objetivo de aprendizaje"
                              />
                              <Button size="sm" variant="outline" onClick={() => removeObjective(idx)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" onClick={addObjective}>
                            <Plus className="w-4 h-4 mr-1" />
                            Añadir objetivo
                          </Button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Temas</label>
                          {editingData.topics?.map((topic, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <Input
                                value={topic}
                                onChange={(e) => updateTopic(idx, e.target.value)}
                                placeholder="Tema a cubrir"
                              />
                              <Button size="sm" variant="outline" onClick={() => removeTopic(idx)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" onClick={addTopic}>
                            <Plus className="w-4 h-4 mr-1" />
                            Añadir tema
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo visualización
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900">
                              {index + 1}. {module.title}
                            </h4>
                            <Badge variant="secondary" className="mt-1">
                              {module.duration}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditModule(module)}>
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteModule(module.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3">{module.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm text-gray-700 mb-2">Objetivos:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {module.objectives.map((objective, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                  {objective}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm text-gray-700 mb-2">Temas:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {module.topics.map((topic, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Formulario para añadir nuevo módulo */}
          {showAddModule && (
            <Card className="mt-4 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Nuevo módulo</h4>
                  <Button size="sm" variant="outline" onClick={() => setShowAddModule(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Título *</label>
                      <Input
                        value={newModule.title || ""}
                        onChange={(e) => setNewModule((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Título del módulo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Duración</label>
                      <Input
                        value={newModule.duration || ""}
                        onChange={(e) => setNewModule((prev) => ({ ...prev, duration: e.target.value }))}
                        placeholder="ej: 2 horas"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción *</label>
                    <Textarea
                      value={newModule.description || ""}
                      onChange={(e) => setNewModule((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción del módulo"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddModule(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddModule} disabled={!newModule.title || !newModule.description}>
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir módulo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            >
              {isGeneratingMaterials ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Sugerir con IA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {materialsError && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertDescription className="text-red-700">{materialsError}</AlertDescription>
            </Alert>
          )}

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

      {/* Botones de navegación */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button onClick={handleNext} disabled={modules.length === 0} className="bg-blue-600 hover:bg-blue-700">
          Continuar
        </Button>
      </div>
    </div>
  )
}
