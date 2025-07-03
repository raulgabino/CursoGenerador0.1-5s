"use server"

import { findAcademicSources } from "@/services/academic-search-service"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Esta es la acción que llamará nuestro componente de frontend
export async function getAndSummarizeSources(topic: string): Promise<string | { error: string }> {
  if (!topic) {
    return { error: "Se requiere un tema para la búsqueda." }
  }

  try {
    const sources = await findAcademicSources(topic)

    if (sources.length === 0) {
      return "No se encontraron fuentes académicas relevantes para este tema."
    }

    // Usamos GPT-4o-mini para sintetizar los resultados
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: synthesisPrompt }],
      temperature: 0.2,
    })

    return response.choices[0].message.content || "No se pudo generar un resumen de las fuentes."
  } catch (error) {
    console.error("Error in getAndSummarizeSources:", error)
    return { error: "Ocurrió un error al procesar la solicitud de fuentes académicas." }
  }
}
