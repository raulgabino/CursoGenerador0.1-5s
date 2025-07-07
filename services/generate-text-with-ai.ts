import { generateTextWithAI as unifiedGenerateText } from "./unified-ai-service"
import type { CourseData, CourseModule } from "@/types/course"

export async function generateTextWithAI(prompt: string, system?: string): Promise<string> {
  const result = await unifiedGenerateText({
    prompt,
    system,
    maxTokens: 4000,
    temperature: 0.7,
  })

  if (!result.success) {
    throw new Error(result.error || "Error al generar texto")
  }

  return result.data || ""
}

export async function generateSimpleText(prompt: string): Promise<string> {
  return generateTextWithAI(prompt)
}

export async function generateCourseStructureWithAI(courseData: CourseData): Promise<CourseModule[]> {
  const prompt = `
Genera una estructura de curso detallada basada en la siguiente información:

Título: ${courseData.title}
Audiencia: ${courseData.audience || "No especificada"}
Modalidad: ${courseData.modality || "No especificada"}
Duración: ${courseData.duration || "No especificada"}
Problema a resolver: ${courseData.problem || "No especificado"}
Propósito: ${courseData.purpose || "No especificado"}
Experiencia previa: ${courseData.experience || "No especificada"}

Genera entre 4 y 8 módulos que cubran el tema de manera completa y progresiva.
Para cada módulo incluye:
- Un título claro y específico
- Una descripción detallada de lo que se cubrirá
- Duración estimada en horas
- 3-5 objetivos de aprendizaje específicos
- 4-6 temas principales a cubrir

Responde ÚNICAMENTE con un JSON válido que contenga un array de objetos con esta estructura:
[
  {
    "id": "modulo-1",
    "title": "Título del módulo",
    "description": "Descripción detallada",
    "duration": "2 horas",
    "objectives": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
    "topics": ["Tema 1", "Tema 2", "Tema 3", "Tema 4"]
  }
]
`

  const system = `Eres un experto en diseño instruccional. Tu tarea es crear estructuras de cursos educativos bien organizadas y pedagógicamente sólidas. Siempre respondes con JSON válido sin texto adicional.`

  try {
    const response = await generateTextWithAI(prompt, system)

    // Limpiar la respuesta para extraer solo el JSON
    let cleanResponse = response.trim()

    // Buscar el inicio y fin del JSON
    const jsonStart = cleanResponse.indexOf("[")
    const jsonEnd = cleanResponse.lastIndexOf("]") + 1

    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd)
    }

    const modules = JSON.parse(cleanResponse)

    if (!Array.isArray(modules)) {
      throw new Error("La respuesta no es un array válido")
    }

    // Validar estructura de cada módulo
    const validatedModules: CourseModule[] = modules.map((module, index) => ({
      id: module.id || `modulo-${index + 1}`,
      title: module.title || `Módulo ${index + 1}`,
      description: module.description || "Descripción del módulo",
      duration: module.duration || "2 horas",
      objectives: Array.isArray(module.objectives) ? module.objectives : ["Objetivo principal"],
      topics: Array.isArray(module.topics) ? module.topics : ["Tema principal"],
    }))

    return validatedModules
  } catch (error) {
    console.error("Error al generar estructura:", error)

    // Estructura fallback
    return [
      {
        id: "modulo-1",
        title: "Introducción y Fundamentos",
        description: "Módulo introductorio que establece las bases del curso",
        duration: "2 horas",
        objectives: ["Comprender los conceptos básicos", "Establecer objetivos de aprendizaje"],
        topics: ["Conceptos fundamentales", "Objetivos del curso", "Metodología"],
      },
      {
        id: "modulo-2",
        title: "Desarrollo Teórico",
        description: "Desarrollo de los conceptos teóricos principales",
        duration: "3 horas",
        objectives: ["Dominar la teoría", "Aplicar conceptos", "Analizar casos"],
        topics: ["Marco teórico", "Principios clave", "Casos de estudio", "Análisis crítico"],
      },
      {
        id: "modulo-3",
        title: "Aplicación Práctica",
        description: "Aplicación práctica de los conocimientos adquiridos",
        duration: "4 horas",
        objectives: ["Implementar soluciones", "Resolver problemas", "Evaluar resultados"],
        topics: ["Ejercicios prácticos", "Proyectos", "Resolución de problemas", "Evaluación"],
      },
      {
        id: "modulo-4",
        title: "Síntesis y Evaluación",
        description: "Integración de conocimientos y evaluación final",
        duration: "2 horas",
        objectives: ["Integrar conocimientos", "Demostrar competencias", "Planificar aplicación"],
        topics: ["Síntesis", "Evaluación final", "Plan de acción", "Recursos adicionales"],
      },
    ]
  }
}
