"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, BookOpen, Users, Calendar, Loader2 } from "lucide-react"
import type { AcademicArticle, ExplainArticleRequest, ExplainArticleResponse } from "@/types/academic-sources"

interface AcademicSourceCardProps {
  article: AcademicArticle
  courseTitle: string
  moduleName: string
}

export function AcademicSourceCard({ article, courseTitle, moduleName }: AcademicSourceCardProps) {
  const [explanation, setExplanation] = useState<string>("")
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false)
  const [hasExplanation, setHasExplanation] = useState(false)

  const handleGetExplanation = async () => {
    if (hasExplanation) return

    setIsLoadingExplanation(true)

    try {
      const requestBody: ExplainArticleRequest = {
        title: article.title,
        authors: article.authors,
        urlToPdf: article.urlToPdf,
        courseTitle,
        moduleName,
        summary: article.summary,
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
        setExplanation(data.data.explanation)
        setHasExplanation(true)
      } else {
        setExplanation("No se pudo generar una explicación para este artículo.")
      }
    } catch (error) {
      console.error("Error getting explanation:", error)
      setExplanation("Error al obtener la explicación.")
    } finally {
      setIsLoadingExplanation(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {article.source}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authors */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{article.authors.length > 0 ? article.authors.join(", ") : "Autores no disponibles"}</span>
        </div>

        {/* Year */}
        {article.year && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{article.year}</span>
          </div>
        )}

        {/* Summary */}
        {article.summary && (
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-3">{article.summary}</p>
          </div>
        )}

        {/* Explanation */}
        {hasExplanation && explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">¿Por qué es valioso para tu curso?</p>
                <p className="text-sm text-blue-800">{explanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetExplanation}
            disabled={isLoadingExplanation || hasExplanation}
            className="flex-1 bg-transparent"
          >
            {isLoadingExplanation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando explicación...
              </>
            ) : hasExplanation ? (
              "Explicación generada"
            ) : (
              "Explicar relevancia"
            )}
          </Button>

          <Button variant="default" size="sm" asChild className="shrink-0">
            <a href={article.urlToPdf} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver artículo
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
