"use server"

import { findAcademicSources } from "@/services/academic-search-service"
import { generateTextWithAI } from "@/services/unified-ai-service"
import type { SearchSourcesRequest } from "@/app/api/course/search-sources/route"

export async function getEnhancedAcademicSources(
  searchContext: SearchSourcesRequest,
): Promise<string | { error: string }> {
  const { courseTitle, moduleName, moduleDescription, moduleHours, assessments } = searchContext

  try {
    console.log(`[EnhancedSourceSearch] Starting enhanced search for module: "${moduleName}"`)

    // PASO 1: Generar múltiples consultas de búsqueda enriquecidas usando IA
    const queryGenerationPrompt = `
      Actúa como un bibliotecario de investigación experto especializado en búsquedas académicas.
      
      CONTEXTO DEL CURSO:
      - Título del curso: "${courseTitle}"
      - Módulo específico: "${moduleName}"
      - Descripción del módulo: "${moduleDescription}"
      - Duración: ${moduleHours || "No especificada"} horas
      - Evaluaciones: ${assessments || "No especificadas"}
      
      Tu tarea es generar 4 consultas de búsqueda académica de alta calidad en inglés que un investigador usaría para encontrar artículos relevantes en bases de datos como arXiv, CORE, o PubMed.
      
      INSTRUCCIONES:
      1. Cada consulta debe ser específica y técnica
      2. Incluye términos clave del dominio académico
      3. Varía el enfoque: teórico, práctico, metodológico, y aplicado
      4. Usa comillas para frases exactas cuando sea apropiado
      5. Incluye sinónimos y términos relacionados
      
      Devuelve únicamente las 4 consultas de búsqueda, cada una en una nueva línea. No añadas numeración, guiones ni explicaciones.
    `

    console.log("[EnhancedSourceSearch] Generating enhanced search queries...")

    const queryResult = await generateTextWithAI(queryGenerationPrompt, undefined, {
      provider: "openai",
      fallbackProviders: ["cohere", "anthropic"],
      maxTokens: 300,
      temperature: 0.3,
    })

    const academicQueries = queryResult.text.trim()
    if (!academicQueries) {
      return { error: "No se pudieron generar consultas de búsqueda académicas." }
    }

    console.log(`[EnhancedSourceSearch] Generated queries:\n${academicQueries}`)

    // PASO 2: Crear consulta combinada más rica
    const queries = academicQueries.split("\n").filter((q) => q.trim())
    const enhancedQuery = queries.join(" OR ")

    // También crear una consulta de respaldo más simple pero contextual
    const fallbackQuery = `"${moduleName}" AND "${courseTitle}" AND (education OR learning OR teaching OR curriculum)`

    console.log(`[EnhancedSourceSearch] Enhanced query: ${enhancedQuery}`)
    console.log(`[EnhancedSourceSearch] Fallback query: ${fallbackQuery}`)

    // PASO 3: Buscar en las APIs académicas con la consulta enriquecida
    let sources = await findAcademicSources(enhancedQuery)

    // Si no se encuentran resultados, intentar con la consulta de respaldo
    if (sources.length === 0) {
      console.log("[EnhancedSourceSearch] No results with enhanced query, trying fallback...")
      sources = await findAcademicSources(fallbackQuery)
    }

    // Si aún no hay resultados, intentar con una consulta más general
    if (sources.length === 0) {
      console.log("[EnhancedSourceSearch] No results with fallback, trying general query...")
      const generalQuery = `"${moduleName}" OR "${courseTitle.split(" ").slice(0, 3).join(" ")}"`
      sources = await findAcademicSources(generalQuery)
    }

    if (sources.length === 0) {
      return `No se encontraron fuentes académicas específicas para el módulo "${moduleName}". 

**Sugerencias para búsqueda manual:**
- Busca en Google Scholar: "${moduleName} education"
- Revisa repositorios institucionales de universidades
- Consulta bases de datos especializadas en educación como ERIC
- Busca en ResearchGate con términos clave del módulo

**Términos de búsqueda recomendados:**
${queries
  .slice(0, 2)
  .map((q) => `- ${q}`)
  .join("\n")}`
    }

    // PASO 4: Usar IA para sintetizar y presentar los mejores resultados con contexto enriquecido
    const synthesisPrompt = `
      Eres un asistente de investigación académica especializado en educación. 
      
      CONTEXTO DEL MÓDULO:
      - Curso: "${courseTitle}"
      - Módulo: "${moduleName}"
      - Descripción: "${moduleDescription}"
      - Duración: ${moduleHours || "No especificada"} horas
      
      A continuación se presenta una lista de artículos de investigación encontrados para este módulo específico.
      
      Lista de artículos (en formato JSON):
      ${JSON.stringify(sources, null, 2)}
      
      INSTRUCCIONES:
      1. Selecciona los 3-4 artículos MÁS RELEVANTES para este módulo específico
      2. Para cada artículo seleccionado, proporciona:
         - Una cita completa en formato APA
         - El enlace directo al artículo
         - Una explicación de 2-3 frases sobre por qué este artículo es valioso específicamente para enseñar "${moduleName}" en el contexto de "${courseTitle}"
         - Una sugerencia concreta de cómo el instructor podría usar este recurso en el módulo
      
      3. Organiza la respuesta en secciones claras
      4. Usa Markdown para formatear la salida
      5. Prioriza artículos que tengan aplicación práctica en educación
      
      FORMATO DE SALIDA:
      ## Fuentes Académicas Recomendadas para "${moduleName}"
      
      ### 📚 Artículo 1
      **[Título del artículo]**
      - **Cita APA:** [cita completa]
      - **Enlace:** [URL]
      - **Relevancia:** [explicación específica]
      - **Aplicación sugerida:** [cómo usar en el módulo]
      
      [Repetir para cada artículo]
    `

    console.log("[EnhancedSourceSearch] Synthesizing results with AI...")

    const summaryResult = await generateTextWithAI(synthesisPrompt, undefined, {
      provider: "anthropic",
      fallbackProviders: ["openai", "cohere"],
      maxTokens: 1500,
      temperature: 0.2,
    })

    console.log(`[EnhancedSourceSearch] Enhanced search completed successfully for "${moduleName}"`)

    return summaryResult.text || "No se pudo generar un resumen de las fuentes encontradas."
  } catch (error: any) {
    console.error("Error in getEnhancedAcademicSources:", error)
    return {
      error: `Error al buscar fuentes académicas: ${error.message || "Error desconocido"}. Por favor, intenta nuevamente.`,
    }
  }
}
