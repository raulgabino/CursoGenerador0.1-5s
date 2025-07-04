import { type NextRequest, NextResponse } from "next/server"
import { getCourseBlueprint, updateCourseBlueprint } from "@/lib/course-blueprint-repository"
import type {
  UpdateBlueprintRequest,
  GetBlueprintResponse,
  SaveBlueprintResponse,
} from "@/types/course-blueprint-persistence"

// GET endpoint - Retrieve a blueprint by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log(`[GetBlueprintAPI] Retrieving blueprint with ID: ${id}`)

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Blueprint ID is required",
        } as GetBlueprintResponse,
        { status: 400 },
      )
    }

    // Get the blueprint from repository
    const blueprint = await getCourseBlueprint(id)

    if (!blueprint) {
      return NextResponse.json(
        {
          success: false,
          error: `Blueprint with ID ${id} not found`,
        } as GetBlueprintResponse,
        { status: 404 },
      )
    }

    console.log(`[GetBlueprintAPI] Blueprint ${id} retrieved successfully`)

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: blueprint,
      } as GetBlueprintResponse,
      { status: 200 },
    )
  } catch (error) {
    console.error("[GetBlueprintAPI] Error retrieving blueprint:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while retrieving blueprint",
      } as GetBlueprintResponse,
      { status: 500 },
    )
  }
}

// PUT endpoint - Update/refine a blueprint
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log(`[UpdateBlueprintAPI] Updating blueprint with ID: ${id}`)

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Blueprint ID is required",
        } as SaveBlueprintResponse,
        { status: 400 },
      )
    }

    // Parse request body
    const body: UpdateBlueprintRequest = await request.json()

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

    console.log(`[UpdateBlueprintAPI] Updating blueprint for course: ${blueprintData.courseTitle}`)

    // Update the blueprint
    const updatedBlueprint = await updateCourseBlueprint(id, blueprintData)

    if (!updatedBlueprint) {
      return NextResponse.json(
        {
          success: false,
          error: `Blueprint with ID ${id} not found`,
        } as SaveBlueprintResponse,
        { status: 404 },
      )
    }

    console.log(`[UpdateBlueprintAPI] Blueprint ${id} updated successfully to revision ${updatedBlueprint.revision}`)

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: updatedBlueprint,
      } as SaveBlueprintResponse,
      { status: 200 },
    )
  } catch (error) {
    console.error("[UpdateBlueprintAPI] Error updating blueprint:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while updating blueprint",
      } as SaveBlueprintResponse,
      { status: 500 },
    )
  }
}
