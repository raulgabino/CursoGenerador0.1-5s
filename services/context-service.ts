"use server"

import { generateTextWithAI } from "./unified-ai-service"

// Función para obtener contexto teórico usando el servicio unificado
export async function getTheoreticalContext(topic: string): Promise<string> {
  try {
    // Prompt específico para el experto teórico
    const systemPrompt = `Eres un catedrático universitario y un experto teórico de renombre mundial en tu campo. Proporciona un resumen académico, denso y conceptual. Enfócate en las definiciones fundamentales, los modelos teóricos y los debates académicos clave. No incluyas ejemplos prácticos ni aplicaciones del mundo real.`

    const prompt = `Proporciona un análisis teórico profundo sobre el tema: '${topic}'. Tu respuesta debe ser exclusivamente el resumen académico en texto plano.`

    // Usar el servicio unificado con preferencia por Claude para análisis teórico
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "anthropic", // Preferir Claude para análisis teórico
      fallbackProviders: ["cohere", "openai", "google"],
      maxTokens: 2000,
      temperature: 0.7,
    })

    console.log(`Contexto teórico generado con ${result.provider}`)
    return result.text || "El contexto teórico no está disponible en este momento."
  } catch (error) {
    console.error("Error al obtener contexto teórico:", error)
    return "El contexto teórico no está disponible en este momento."
  }
}

// Función para obtener contexto práctico usando el servicio unificado
export async function getPracticalContext(topic: string): Promise<string> {
  try {
    // Prompt específico para el experto práctico
    const systemPrompt = `Eres un consultor de la industria y un experto en la aplicación práctica del conocimiento. Describe las aplicaciones del mundo real, casos de uso y ejemplos concretos. Enfócate exclusivamente en cómo este conocimiento resuelve problemas tangibles en el ámbito profesional o cotidiano. Evita la teoría profunda y las definiciones académicas.`

    const prompt = `Describe las aplicaciones prácticas y casos de uso del mundo real sobre el tema: '${topic}'.`

    // Usar el servicio unificado con preferencia por Cohere para aplicaciones prácticas
    const result = await generateTextWithAI(prompt, systemPrompt, {
      provider: "cohere", // Preferir Cohere para aplicaciones prácticas
      fallbackProviders: ["google", "openai", "anthropic"],
      maxTokens: 2000,
      temperature: 0.7,
    })

    console.log(`Contexto práctico generado con ${result.provider}`)
    return result.text || "El contexto práctico no está disponible en este momento."
  } catch (error) {
    console.error("Error al obtener contexto práctico:", error)
    return "El contexto práctico no está disponible en este momento."
  }
}

// Función orquestadora que combina ambos contextos
export async function generateExpertContext(topic: string): Promise<{
  theoreticalContext: string
  practicalContext: string
}> {
  console.log(`Generando contexto de expertos para: ${topic}`)

  // Ejecutar ambas llamadas en paralelo para optimizar el tiempo de respuesta
  const [theoreticalContext, practicalContext] = await Promise.all([
    getTheoreticalContext(topic),
    getPracticalContext(topic),
  ])

  console.log("Contexto de expertos generado exitosamente")

  return {
    theoreticalContext,
    practicalContext,
  }
}
