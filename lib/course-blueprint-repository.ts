"use server"

import type { CourseBlueprint_DB, SaveBlueprintRequest } from "@/types/course-blueprint-persistence"

// In-memory storage that simulates a database
// In a real application, this would be replaced with actual database calls
const courseBlueprintStorage = new Map<string, CourseBlueprint_DB>()

// Generate unique IDs
function generateId(): string {
  return `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function createCourseBlueprint(data: SaveBlueprintRequest): Promise<CourseBlueprint_DB> {
  const now = new Date()
  const blueprint: CourseBlueprint_DB = {
    id: generateId(),
    userId: data.userId || undefined,
    draftId: generateDraftId(),
    revision: 1,
    blueprintData: data.blueprintData,
    createdAt: now,
    updatedAt: now,
  }

  courseBlueprintStorage.set(blueprint.id, blueprint)
  console.log(`[CourseBlueprintRepository] Created blueprint ${blueprint.id} with draftId ${blueprint.draftId}`)

  return blueprint
}

export async function getCourseBlueprint(id: string): Promise<CourseBlueprint_DB | null> {
  const blueprint = courseBlueprintStorage.get(id)
  if (!blueprint) {
    console.log(`[CourseBlueprintRepository] Blueprint ${id} not found`)
    return null
  }

  console.log(`[CourseBlueprintRepository] Retrieved blueprint ${id} (revision ${blueprint.revision})`)
  return blueprint
}

export async function updateCourseBlueprint(
  id: string,
  blueprintData: CourseBlueprint_DB["blueprintData"],
): Promise<CourseBlueprint_DB | null> {
  const existingBlueprint = courseBlueprintStorage.get(id)
  if (!existingBlueprint) {
    console.log(`[CourseBlueprintRepository] Cannot update blueprint ${id} - not found`)
    return null
  }

  const updatedBlueprint: CourseBlueprint_DB = {
    ...existingBlueprint,
    blueprintData,
    revision: existingBlueprint.revision + 1,
    updatedAt: new Date(),
  }

  courseBlueprintStorage.set(id, updatedBlueprint)
  console.log(`[CourseBlueprintRepository] Updated blueprint ${id} to revision ${updatedBlueprint.revision}`)

  return updatedBlueprint
}

// Utility functions for debugging and testing
export async function getAllCourseBlueprints(): Promise<CourseBlueprint_DB[]> {
  return Array.from(courseBlueprintStorage.values())
}

export async function getBlueprintsByDraftId(draftId: string): Promise<CourseBlueprint_DB[]> {
  return Array.from(courseBlueprintStorage.values()).filter((bp) => bp.draftId === draftId)
}

export async function clearAllCourseBlueprints(): Promise<void> {
  courseBlueprintStorage.clear()
  console.log(`[CourseBlueprintRepository] Cleared all blueprints`)
}
