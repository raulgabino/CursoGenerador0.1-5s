import { type NextRequest, NextResponse } from "next/server"
import { createCourseBlueprint } from "@/lib/course-blueprint-repository"
import type { SaveBlueprintRequest, SaveBlueprintResponse } from "@/types/course-blueprint-persistence"

export async function POST(request: NextRequest) {
  try {
    console.log("[SaveBlueprintAPI] Received save blueprint request")

    // Parse request body
    const body: SaveBlueprintRequest = await request.json()

    // Validate that blueprintData is present
    if (!body.blueprintData) {
      return NextResponse.json(
        {
          success: false,
          error: "blueprintData is required",
        } as SaveBlueprintResponse,
        { status: 400 },
      )
    }

    // Validate that blueprintData has required structure
    const { blueprintData } = body
    if (
      !blueprintData.courseTitle ||
      !blueprintData.modules ||
      !Array.isArray(blueprintData.modules) ||
      typeof blueprintData.totalHours !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid blueprintData structure",
        } as SaveBlueprintResponse,
        { status: 400 },
      )
    }

    console.log(`[SaveBlueprintAPI] Saving blueprint for course: ${blueprintData.courseTitle}`)

    // Create the blueprint record
    const savedBlueprint = await createCourseBlueprint(body)

    console.log(`[SaveBlueprintAPI] Blueprint saved successfully with ID: ${savedBlueprint.id}`)

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: savedBlueprint,
      } as SaveBlueprintResponse,
      { status: 200 },
    )
  } catch (error) {
    console.error("[SaveBlueprintAPI] Error saving blueprint:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while saving blueprint",
      } as SaveBlueprintResponse,
      { status: 500 },
    )
  }
}
