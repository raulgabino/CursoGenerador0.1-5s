"use server"

import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google-generative-ai"

// Función para obtener contexto teórico usando Claude
export async function getTheoreticalContext(topic: string): Promise<string> {
  try {
    // Validar que la API key esté configurada
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY no está configurada")
    }

    // Inicializar el cliente de Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Prompt específico para Claude como catedrático universitario
    const prompt = `Eres un catedrático universitario y un experto teórico de renombre mundial en tu campo. Proporciona un resumen académico, denso y conceptual sobre el tema: '${topic}'. Enfócate en las definiciones fundamentales, los modelos teóricos y los debates académicos clave. No incluyas ejemplos prácticos ni aplicaciones del mundo real. Tu respuesta debe ser exclusivamente el resumen en texto plano.`

    // Llamar a la API de Claude
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    // Extraer el contenido de texto de la respuesta
    const textContent = response.content
      .filter((content): content is Anthropic.TextBlock => content.type === "text")
      .map((content) => content.text)
      .join("")

    return textContent || "El contexto teórico no está disponible en este momento."
  } catch (error) {
    console.error("Error al obtener contexto teórico:", error)
    return "El contexto teórico no está disponible en este momento."
  }
}

// Función para obtener contexto práctico usando Gemini
export async function getPracticalContext(topic: string): Promise<string> {
  try {
    // Validar que la API key esté configurada
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY no está configurada")
    }

    // Inicializar el cliente de Google AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

    // Obtener el modelo Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    // Prompt específico para Gemini como consultor de industria
    const prompt = `Eres un consultor de la industria y un experto en la aplicación práctica del conocimiento. Describe las aplicaciones del mundo real, casos de uso y ejemplos concretos sobre el tema: '${topic}'. Enfócate exclusivamente en cómo este conocimiento resuelve problemas tangibles en el ámbito profesional o cotidiano. Evita la teoría profunda y las definiciones académicas.`

    // Llamar a la API de Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return text || "El contexto práctico no está disponible en este momento."
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
  // Ejecutar ambas llamadas en paralelo para optimizar el tiempo de respuesta
  const [theoreticalContext, practicalContext] = await Promise.all([
    getTheoreticalContext(topic),
    getPracticalContext(topic),
  ])

  return {
    theoreticalContext,
    practicalContext,
  }
}
