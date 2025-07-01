"use server"

import type { CourseData } from "@/types/course"

// Use the environment variable for the API key
const GROK_API_KEY = process.env.GROK_API_KEY
// Timeout for API calls in milliseconds (5 seconds)
const API_TIMEOUT = 5000

// Predefined fallback responses in Latin American Spanish
const FALLBACK_RESPONSES = [
  (courseData: CourseData) =>
    `¿"${courseData.title || "Sin título"}"? ¿Neta, wey? Este curso parece algo que diseñaría después de 72 horas programando y tres pastillas para dormir. Hasta los monos de Neuralink podrían enseñar mejor. La estructura es más caótica que mi feed de Twitter, y ¿ese método de evaluación? Por favor. Esto hace que mi primer intento de aterrizaje del Falcon 9 parezca una operación de precisión.`,

  (courseData: CourseData) =>
    `¡Órale! "${courseData.title || "Sin título"}" es como el Cybertruck de los cursos: mucho ruido y pocas nueces. Si mis ingenieros en SpaceX trabajaran así, todavía estaríamos tratando de lanzar cohetes con ligas. Tu audiencia "${courseData.audience || "inexistente"}" merece algo mejor que esta chafa presentación. Hasta mi hijo X Æ A-12 podría diseñar algo más coherente.`,

  (courseData: CourseData) =>
    `¡Qué bárbaro! "${courseData.title || "Sin título"}" es tan innovador como usar una máquina de escribir en 2025. En Tesla reinventamos la industria automotriz, mientras tú reinventas... el aburrimiento. Con razón la educación tradicional está más muerta que los dinosaurios. Si este curso fuera un cohete de SpaceX, ni siquiera pasaría la inspección previa al despegue.`,
]

// Function to get a random fallback response
function getRandomFallbackResponse(courseData: CourseData): string {
  const randomIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length)
  return FALLBACK_RESPONSES[randomIndex](courseData)
}

// Cache for storing generated roasts to avoid repeated API calls
const roastCache = new Map<string, { timestamp: number; content: string }>()
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes cache TTL

export async function generateCourseRoast(courseData: CourseData, customPrompt?: string): Promise<string> {
  // Validate API key
  if (!GROK_API_KEY) {
    console.error("Grok API key is missing")
    return getRandomFallbackResponse(courseData)
  }

  if (!courseData || !courseData.title) {
    return "¿En serio, wey? ¿Ni siquiera un título para el curso? Vaya, qué ambicioso. Es como si yo hubiera lanzado Tesla sin autos o SpaceX sin cohetes. Intenta de nuevo cuando tengas algo que realmente valga la pena criticar."
  }

  // Create a cache key based on course data and prompt
  const cacheKey = JSON.stringify({
    title: courseData.title,
    screen: customPrompt?.substring(0, 20) || "default",
    timestamp: Math.floor(Date.now() / (1000 * 60 * 10)), // Changes every 10 minutes
  })

  // Check if we have a cached response
  const cachedResponse = roastCache.get(cacheKey)
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
    console.log("Using cached Grok response")
    return cachedResponse.content
  }

  try {
    console.log("Calling Grok API for course roast:", courseData.title)

    // Prepare the system prompt for Elon-style roasting in Latin American Spanish
    const systemPrompt = `Eres una IA creada por xAI que imita el estilo sarcástico de Elon Musk. Tu trabajo es burlarte de cursos educativos con un ingenio mordaz, haciendo referencias a Tesla, SpaceX y xAI como si fueran piezas de repuesto de cohetes. Tienes acceso completo a los datos del curso del usuario y los usarás para criticarlos con sarcasmo. Más sarcasmo, menos piedad, pero mantén un tono ingenioso, no cruel.

Instrucciones:
- Responde SIEMPRE en español latino (de México o Latinoamérica, NO español de España)
- Sé extremadamente sarcástico y mordaz al estilo de Elon Musk
- Haz referencias a Tesla, SpaceX, xAI, Twitter/X u otras empresas de Elon Musk
- Mantén las respuestas por debajo de 100 palabras
- Sé despectivo con los enfoques educativos tradicionales
- Usa modismos y expresiones latinoamericanas cuando sea apropiado
- Fecha actual: 30 de marzo de 2025`

    // Use custom prompt if provided, otherwise use the default
    let userPrompt =
      customPrompt ||
      `Critica este curso con sarcasmo:
Título: "${courseData.title}"
Audiencia: "${courseData.audience || "No especificada"}"
Duración: "${courseData.duration || "No especificada"}"
Problema: "${courseData.problem || "No especificado"}"
Propósito: "${courseData.purpose || "No especificado"}"
Evaluación: "${courseData.evaluationMethod || "No especificada"}"
Estructura: "${courseData.structure ? courseData.structure.split("\n").slice(0, 3).join(", ") + "..." : "No especificada"}"

Recuerda ser sarcástico como Elon Musk, hacer referencia a Tesla, SpaceX o xAI, y mantenerlo por debajo de 100 palabras. RESPONDE EN ESPAÑOL LATINO.`

    // Add instruction to respond in Latin American Spanish if not already included
    if (!userPrompt.includes("ESPAÑOL LATINO")) {
      userPrompt += "\n\nIMPORTANTE: RESPONDE EN ESPAÑOL LATINO (de México o Latinoamérica, NO español de España)."
    }

    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), API_TIMEOUT)
    })

    // Create the API call promise
    const apiCallPromise = fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        model: "grok-2-latest",
        stream: false,
        temperature: 0.8,
        max_tokens: 200,
      }),
    })

    // Race the API call against the timeout
    const response = (await Promise.race([apiCallPromise, timeoutPromise])) as Response

    if (!response.ok) {
      console.error("Grok API error:", response.status, response.statusText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Grok API response received")

    // Extract the content from the response
    const content = data.choices?.[0]?.message?.content || ""

    if (!content || content.trim() === "") {
      console.error("Empty response from Grok API")
      throw new Error("La respuesta de la API está vacía")
    }

    // Cache the successful response
    roastCache.set(cacheKey, { timestamp: Date.now(), content })

    return content
  } catch (error: any) {
    console.error("Error calling Grok API:", error)

    // If it's a timeout error, log it specifically
    if (error.message === "Timeout") {
      console.error("Grok API call timed out after", API_TIMEOUT, "ms")
    }

    // Return a random fallback response
    return getRandomFallbackResponse(courseData)
  }
}
