"use server"

import { generateTextWithAI as unifiedGenerateText } from "./unified-ai-service"
import type { CourseModule } from "@/types/course"

// Re-exportar la función principal del servicio unificado
export async function generateTextWithAI(
  prompt: string,
  systemPrompt?: string,
  options?: {
    provider?: "openai" | "anthropic" | "google" | "cohere"
    fallbackProviders?: ("openai" | "anthropic" | "google" | "cohere")[]
    maxTokens?: number
    temperature?: number
  },
) {
  return unifiedGenerateText(prompt, systemPrompt, options)
}

// Función simplificada para casos básicos
export async function generateSimpleText(prompt: string, systemPrompt?: string): Promise<string> {
  const result = await unifiedGenerateText(prompt, systemPrompt, {
    provider: "openai",
    fallbackProviders: ["google"],
    maxTokens: 1000,
    temperature: 0.7,
  })

  return result.text
}

// Función específica para generar estructura de curso
export async function generateCourseStructureWithAI(courseData: any): Promise<CourseModule[]> {
  const { generateCourseStructureWithAI: generateStructure } = await import("./unified-ai-service")
  return generateStructure(courseData)
}
