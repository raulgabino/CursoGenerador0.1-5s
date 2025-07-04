import { type NextRequest, NextResponse } from "next/server"
import { getEnhancedAcademicSources } from "@/app/actions/enhanced-source-actions"

export interface SearchSourcesRequest {
  courseTitle: string
  moduleName: string
  moduleDescription: string
  moduleHours?: number
  assessments?: string
}

export interface SearchSourcesResponse {
  success: boolean
  data?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[SearchSourcesAPI] Received search sources request")

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

    console.log(`[SearchSourcesAPI] Searching sources for module: ${body.moduleName} in course: ${body.courseTitle}`)

    // Call the enhanced source search action
    const result = await getEnhancedAcademicSources(body)

    if (typeof result === "object" && result.error) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        } as SearchSourcesResponse,
        { status: 500 },
      )
    }

    console.log("[SearchSourcesAPI] Sources found successfully")

    return NextResponse.json(
      {
        success: true,
        data: result as string,
      } as SearchSourcesResponse,
      { status: 200 },
    )
  } catch (error) {
    console.error("[SearchSourcesAPI] Error searching sources:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while searching academic sources",
      } as SearchSourcesResponse,
      { status: 500 },
    )
  }
}
