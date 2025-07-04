"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BookOpen, Users, Calendar, ExternalLink, Plus, Trash2, Edit2, Check, X } from "lucide-react"
import type { CourseData, CourseModule } from "@/types/course"
import type {
  SearchSourcesRequest,
  SearchSourcesResponse,
  ExplainArticleRequest,
  ExplainArticleResponse,
} from "@/types/academic-sources"

interface ContentScreenProps {
  courseData: CourseData
  onUpdate: (data: Partial<CourseData>) => void
  onNext: () => void
  onBack: () => void
}

interface EnrichedSource {
  id: string
  title: string
  authors: string[]
  year: string | null
  urlToPdf: string
  source: "CORE" | "arXiv"
  summary?: string
  explanation: string | null
  isLoadingExplanation: boolean
}

export default function ContentScreen({ courseData, onUpdate, onNext, onBack }: ContentScreenProps) {
  const [modules, setModules] = useState<CourseModule[]>(courseData.structure || [])
  const [sources, setSources] = useState<EnrichedSource[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [editingModule, setEditingModule] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // Auto-save modules to courseData when they change
  useEffect(() => {
    onUpdate({ structure: modules })
  }, [modules, onUpdate])

  // Auto-load explanations for sources that need them
  useEffect(() => {
    const loadExplanations = async () => {
      const sourcesNeedingExplanations = sources.filter(
        (source) => source.isLoadingExplanation && source.explanation === null,
      )

      for (const source of sourcesNeedingExplanations) {
        try {
          const requestBody: ExplainArticleRequest = {
            title: source.title,
            authors: source.authors,
            urlToPdf: source.urlToPdf,
            courseTitle: courseData.title || "Curso",
            moduleName: "Módulo del curso",
            summary: source.summary,
          }

          const response = await fetch("/api/sources/explain", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          })

          const data: ExplainArticleResponse = await response.json()

          if (data.success && data.data) {
            setSources((prevSources) =>
              prevSources.map((s) =>
                s.id === source.id
                  ? {
                      ...s,
                      explanation: data.data!.explanation,
                      isLoadingExplanation: false,
                    }
                  : s,
              ),
            )
          } else {
            // Handle error case
            setSources((prevSources) =>
              prevSources.map((s) =>
                s.id === source.id
                  ? {
                      ...s,
                      explanation: "No se pudo generar una explicación para este artículo.",
                      isLoadingExplanation: false,
                    }
                  : s,
              ),
            )
          }
        } catch (error) {
          console.error("Error loading explanation for source:", source.id, error)
          setSources((prevSources) =>
            prevSources.map((s) =>
              s.id === source.id
                ? {
                    ...s,
                    explanation: "Error al obtener la explicación.",
                    isLoadingExplanation: false,
                  }
                : s,
            ),
          )
        }

        // Add a small delay between requests to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    loadExplanations()
  }, [sources, courseData.title])

  const handleFindSources = async (module: CourseModule) => {
    setIsSearching(true)
    setSearchError(null)
    setSources([])

    try {
      const requestBody: SearchSourcesRequest = {
        courseTitle: courseData.title || "Curso",
        moduleName: module.moduleName,
        moduleDescription: module.moduleDescription,
      }

      const response = await fetch("/api/sources/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data: SearchSourcesResponse = await response.json()

      if (data.success && data.data) {
        // Initialize sources with explanation loading state
        const enrichedSources: EnrichedSource[] = data.data.map((article) => ({
          ...article,
          explanation: null,
          isLoadingExplanation: true,
        }))

        setSources(enrichedSources)
      } else {
        setSearchError(data.error || "Error al buscar fuentes académicas")
      }
    } catch (error) {
      console.error("Error searching sources:", error)
      setSearchError("Error de conexión al buscar fuentes")
    } finally {
      setIsSearching(false)
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
    }
  }

  const cancelEdit = () => {
    setEditingModule(null)
    setEditName("")
    setEditDescription("")
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Paso 3: Organiza el contenido</h2>
        <p className="text-gray-600 mb-6">
          Revisa y ajusta la estructura de tu curso. Puedes editar los módulos o buscar fuentes académicas para
          enriquecer el contenido.
        </p>
      </div>

      {/* Course Modules Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Módulos del curso</h3>
          <Button onClick={addModule} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Añadir módulo
          </Button>
        </div>

        <div className="space-y-4">
          {modules.map((module, index) => (
            <Card key={index} className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  {editingModule === index ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre del módulo"
                        className="font-semibold"
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Descripción del módulo"
                      />
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
                        <CardTitle className="text-lg">
                          Módulo {index + 1}: {module.moduleName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">{module.moduleDescription}</p>
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
              {editingModule !== index && (
                <CardContent>
                  <Button onClick={() => handleFindSources(module)} disabled={isSearching} className="w-full">
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Buscando artículos...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Buscar fuentes para este módulo
                      </>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Search Error */}
      {searchError && (
        <Alert variant="destructive">
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {/* Academic Sources Section */}
      {sources.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Fuentes académicas encontradas</h3>
          <div className="space-y-4">
            {sources.map((source) => (
              <Card key={source.id} className="w-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg leading-tight">{source.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {source.source}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Authors */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{source.authors.length > 0 ? source.authors.join(", ") : "Autores no disponibles"}</span>
                  </div>

                  {/* Year */}
                  {source.year && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{source.year}</span>
                    </div>
                  )}

                  {/* Summary */}
                  {source.summary && (
                    <div className="text-sm text-muted-foreground">
                      <p className="line-clamp-3">{source.summary}</p>
                    </div>
                  )}

                  {/* Explanation Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">¿Por qué es valioso para tu curso?</p>
                        {source.isLoadingExplanation ? (
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Generando explicación...</span>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-800">{source.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="default" size="sm" asChild className="shrink-0">
                      <a
                        href={source.urlToPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver artículo
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button onClick={onBack} variant="outline">
          Anterior
        </Button>
        <Button onClick={onNext}>Siguiente</Button>
      </div>
    </div>
  )
}
