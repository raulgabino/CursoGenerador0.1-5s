"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Loader2 } from "lucide-react"
import type { CourseModule } from "@/types/course-blueprint"

interface ModuleCardProps {
  module: CourseModule
  moduleIndex: number
  courseTitle: string
  onSourcesFound: (moduleIndex: number, sources: string) => void
}

export default function ModuleCard({ module, moduleIndex, courseTitle, onSourcesFound }: ModuleCardProps) {
  const [isLoadingSources, setIsLoadingSources] = useState(false)
  const [sourcesResult, setSourcesResult] = useState<string>("")

  const handleFindSources = async () => {
    setIsLoadingSources(true)
    setSourcesResult("")

    try {
      // Crear un objeto rico con contexto completo para la búsqueda
      const searchContext = {
        courseTitle: courseTitle,
        moduleName: module.moduleName,
        moduleDescription: `${module.moduleOutcomes.join(". ")}. Actividades: ${module.activities.join(", ")}`,
        moduleHours: module.moduleHours,
        assessments: module.assessments.join(", "),
      }

      console.log("Searching sources with context:", searchContext)

      const response = await fetch("/api/course/search-sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchContext),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}: ${response.statusText}`)
      }

      if (result.success) {
        setSourcesResult(result.data)
        onSourcesFound(moduleIndex, result.data)
      } else {
        throw new Error(result.error || "Error desconocido al buscar fuentes")
      }
    } catch (error: any) {
      console.error("Error searching sources:", error)
      const errorMessage = `Error: ${error.message || "No se pudieron encontrar fuentes académicas"}`
      setSourcesResult(errorMessage)
      onSourcesFound(moduleIndex, errorMessage)
    } finally {
      setIsLoadingSources(false)
    }
  }

  return (
    <Card className="w-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Encabezado del Módulo */}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-blue-800">
          Módulo {moduleIndex + 1}: {module.moduleName}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>⏱️ {module.moduleHours} horas</span>
          <span>🎯 {module.moduleOutcomes.length} objetivos</span>
          <span>📋 {module.activities.length} actividades</span>
        </div>
      </CardHeader>

      {/* Contenido del Módulo */}
      <CardContent className="space-y-4">
        {/* Objetivos del Módulo */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Objetivos:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {module.moduleOutcomes.map((outcome, idx) => (
              <li key={idx}>{outcome}</li>
            ))}
          </ul>
        </div>

        {/* Actividades Principales */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Actividades principales:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {module.activities.slice(0, 3).map((activity, idx) => (
              <li key={idx}>{activity}</li>
            ))}
            {module.activities.length > 3 && (
              <li className="text-gray-500 italic">... y {module.activities.length - 3} más</li>
            )}
          </ul>
        </div>

        {/* Botón de Búsqueda de Fuentes */}
        <div className="pt-3 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFindSources}
            disabled={isLoadingSources}
            className="w-full bg-white hover:bg-blue-50 border-blue-200"
          >
            {isLoadingSources ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando fuentes académicas...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Buscar Fuentes Académicas para este Módulo
              </>
            )}
          </Button>

          {/* Área de Resultados */}
          {sourcesResult && (
            <div className="mt-4 rounded-md border border-gray-300 bg-gray-50 p-4 text-sm">
              <h4 className="font-semibold mb-2 text-gray-800">Fuentes Académicas Encontradas:</h4>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: sourcesResult.replace(/\n/g, "<br />").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
