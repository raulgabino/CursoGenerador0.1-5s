import { type NextRequest, NextResponse } from "next/server"
import { findAcademicSources } from "@/services/academic-search-service"

export interface SearchSourcesRequest {
  courseTitle: string
  moduleName: string
  moduleDescription: string
}

export interface AcademicArticle {
  id: string
  title: string
  authors: string[]
  year: string | null
  urlToPdf: string
  source: "CORE" | "arXiv"
  summary?: string
}

export interface SearchSourcesResponse {
  success: boolean
  data?: AcademicArticle[]
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[SearchAPI] Received academic search request")

    // Parse request body
    const body: SearchSourcesRequest = await request.json()

    // Validate required fields
    if (!body.courseTitle || !body.moduleName || !body.moduleDescription) {
      return NextResponse.json(
        {
          success: false,
          error: "courseTitle, moduleName, and moduleDescription are required",
        } as SearchSourcesResponse,
        { status: 400 },
      )
    }

    console.log(`[SearchAPI] Searching for: ${body.moduleName} in course: ${body.courseTitle}`)

    // Create enhanced search query combining all context
    const searchQuery = `${body.courseTitle}: ${body.moduleName} - ${body.moduleDescription}`

    // Call academic search service (no LLM involved)
    const academicSources = await findAcademicSources(searchQuery)

    if (academicSources.length === 0) {
      console.log("[SearchAPI] No academic sources found")
      return NextResponse.json(
        {
          success: true,
          data: [],
        } as SearchSourcesResponse,
        { status: 200 },
      )
    }

    // Transform to standardized format
    const articles: AcademicArticle[] = academicSources.slice(0, 5).map((source, index) => ({
      id: `${source.source.toLowerCase()}_${Date.now()}_${index}`,
      title: source.title,
      authors: source.authors,
      year: source.year,
      urlToPdf: source.url,
      source: source.source,
      summary: source.summary,
    }))

    console.log(`[SearchAPI] Found ${articles.length} academic articles`)

    return NextResponse.json(
      {
        success: true,
        data: articles,
      } as SearchSourcesResponse,
      { status: 200 },
    )
  } catch (error) {
    console.error("[SearchAPI] Error searching academic sources:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while searching academic sources",
      } as SearchSourcesResponse,
      { status: 500 },
    )
  }
}
