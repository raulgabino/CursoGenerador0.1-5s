"use server"

import { findAcademicSources } from "@/services/academic-search-service"
import { OpenAI } from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function getAndSummarizeSources(topic: string): Promise<string | { error: string }> {
  if (!topic) {
    return { error: "Se requiere un tema para la búsqueda." }
  }

  try {
    // PASO 1: Generar consultas de búsqueda de alta calidad a partir del tema del usuario.
    console.log(`[SourceSearch] Generating academic queries for topic: "${topic}"`)
    const queryGenerationPrompt = `
      Actúa como un bibliotecario de investigación experto. El siguiente es el título de un módulo de un curso: "${topic}".
      Tu tarea es generar 3 consultas de búsqueda de alta calidad, en inglés, que un investigador usaría para encontrar artículos académicos relevantes en una base de datos como arXiv o CORE.
      Devuelve únicamente las 3 consultas de búsqueda, cada una en una nueva línea. No añadas numeración, guiones ni comillas.
    `

    const queryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: queryGenerationPrompt }],
      temperature: 0.3,
      max_tokens: 200,
    })

    const academicQueries = queryResponse.choices[0].message.content?.trim()
    if (!academicQueries) {
      return { error: "No se pudieron generar consultas de búsqueda académicas." }
    }

    console.log(`[SourceSearch] Generated queries:\n${academicQueries}`)

    // Combinar las consultas generadas en una sola cadena de búsqueda para las APIs.
    const combinedQuery = academicQueries.split("\n").join(" OR ")

    // PASO 2: Buscar en las APIs académicas usando las consultas de alta calidad.
    const sources = await findAcademicSources(combinedQuery)

    if (sources.length === 0) {
      return "No se encontraron fuentes académicas relevantes para este tema. Intenta con un tema más específico o reformulando el título del módulo."
    }

    // PASO 3: Usar un LLM para sintetizar y presentar los mejores resultados.
    const synthesisPrompt = `
      Eres un asistente de investigación para un catedrático. A continuación se presenta una lista de artículos de investigación encontrados sobre el tema "${topic}".
      Tu tarea es seleccionar los 3 artículos MÁS RELEVANTES y presentarlos en un formato claro y útil.
      
      Lista de artículos encontrados (en formato JSON):
      ${JSON.stringify(sources, null, 2)}
      
      Instrucciones de formato de salida:
       - Para cada uno de los 3 artículos seleccionados, proporciona:
         1. Una cita completa en formato APA.
         2. Un enlace directo al artículo (usa el campo 'url').
         3. Una sola frase concisa explicando por qué este artículo es valioso para un instructor que diseña un curso sobre este tema.
       
       - Usa Markdown para formatear la salida. El título del artículo debe estar en negrita.
    `

    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: synthesisPrompt }],
      temperature: 0.2,
      max_tokens: 1000, // Aumentamos el límite para asegurar respuestas completas
    })

    return summaryResponse.choices[0].message.content || "No se pudo generar un resumen de las fuentes."
  } catch (error) {
    console.error("Error in getAndSummarizeSources:", error)
    return { error: "Ocurrió un error al procesar la solicitud de fuentes académicas." }
  }
}
