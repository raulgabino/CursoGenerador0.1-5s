"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Loader2 } from "lucide-react"
import type { CourseModule } from "@/types/course-blueprint"
// Asumimos que esta acción existe y funciona. Si no, necesitaríamos su código.
import { getAndSummarizeSources } from "@/app/actions/source-actions"

interface ModuleCardProps {
  module: CourseModule
  moduleIndex: number
  courseTitle: string
}

export default function ModuleCard({ module, moduleIndex, courseTitle }: ModuleCardProps) {
  const [isLoadingSources, setIsLoadingSources] = useState(false)
  const [sourcesResult, setSourcesResult] = useState<string>("")

  const handleFindSources = async () => {
    setIsLoadingSources(true)
    setSourcesResult("")
    try {
      const result = await getAndSummarizeSources(module.moduleName)
      setSourcesResult(typeof result === "string" ? result : result.error || "Error desconocido")
    } catch (error: any) {
      setSourcesResult(`Error: ${error.message}`)
    } finally {
      setIsLoadingSources(false)
    }
  }

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-blue-800">
          Módulo {moduleIndex + 1}: {module.moduleName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Objetivos:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {module.moduleOutcomes?.map((outcome, idx) => <li key={idx}>{outcome}</li>) || (
                <li>No hay objetivos definidos</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Actividades principales:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {module.activities?.slice(0, 3).map((activity, idx) => <li key={idx}>{activity}</li>) || (
                <li>No hay actividades definidas</li>
              )}
              {module.activities && module.activities.length > 3 && (
                <li className="text-gray-500 italic">... y {module.activities.length - 3} más</li>
              )}
            </ul>
          </div>

          <div className="pt-3 border-t">
            <Button variant="outline" size="sm" onClick={handleFindSources} disabled={isLoadingSources}>
              {isLoadingSources ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BookOpen className="mr-2 h-4 w-4" />
              )}
              Buscar Fuentes Académicas
            </Button>
            {sourcesResult && (
              <div
                className="mt-4 p-4 bg-gray-50 rounded-md text-sm"
                dangerouslySetInnerHTML={{ __html: sourcesResult.replace(/\n/g, "<br />") }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
