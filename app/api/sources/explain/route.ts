import { type NextRequest, NextResponse } from "next/server"
import { OpenAI } from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ExplainArticleRequest {
  title: string
  authors: string[]
  urlToPdf: string
  courseTitle: string
  moduleName: string
  summary?: string
}

export interface ExplainArticleResponse {
  success: boolean
  data?: {
    explanation: string
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[ExplainAPI] Received article explanation request")

    // Parse request body
    const body: ExplainArticleRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.courseTitle || !body.moduleName) {
      return NextResponse.json(
        {
          success: false,
          error: "title, courseTitle, and moduleName are required",
        } as ExplainArticleResponse,
        { status: 400 },
      )
    }

    console.log(`[ExplainAPI] Generating explanation for article: "${body.title}"`)

    // Build context-rich prompt for LLM
    const authorsText = body.authors.length > 0 ? body.authors.join(", ") : "Unknown authors"
    const summaryContext = body.summary ? `\n\nResumen del artículo: ${body.summary}` : ""

    const prompt = `
Eres un asistente especializado en educación superior. Un instructor está diseñando un curso titulado "${body.courseTitle}" y específicamente está trabajando en el módulo "${body.moduleName}".

Ha encontrado el siguiente artículo académico:
- Título: "${body.title}"
- Autores: ${authorsText}
- Enlace: ${body.urlToPdf}${summaryContext}

Tu tarea es explicar en 2-3 líneas concisas por qué este artículo específico sería valioso para un instructor que está diseñando este módulo del curso. Enfócate en:
1. Cómo el contenido del artículo se relaciona directamente con el módulo
2. Qué valor práctico o teórico aporta al diseño del curso
3. Cómo podría utilizarlo el instructor (ej. como lectura, ejemplo, caso de estudio)

Responde únicamente con la explicación, sin introducción ni conclusión.
    `.trim()

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    })

    const explanation = completion.choices[0].message.content?.trim()

    if (!explanation) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate explanation",
        } as ExplainArticleResponse,
        { status: 500 },
      )
    }

    console.log(`[ExplainAPI] Generated explanation successfully`)

    return NextResponse.json(
      {
        success: true,
        data: {
          explanation,
        },
      } as ExplainArticleResponse,
      { status: 200 },
    )
  } catch (error) {
    console.error("[ExplainAPI] Error generating explanation:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while generating explanation",
      } as ExplainArticleResponse,
      { status: 500 },
    )
  }
}
