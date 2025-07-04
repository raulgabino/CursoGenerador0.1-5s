import type { CourseBlueprint } from "./course-blueprint"

export interface CourseBlueprint_DB {
  id: string
  userId?: string // Optional for now, can be added when user system is implemented
  draftId: string
  revision: number
  blueprintData: CourseBlueprint
  createdAt: Date
  updatedAt: Date
}

export interface SaveBlueprintRequest {
  blueprintData: CourseBlueprint
  userId?: string // Optional for now
}

export interface UpdateBlueprintRequest {
  blueprintData: CourseBlueprint
}

export interface SaveBlueprintResponse {
  success: boolean
  data?: CourseBlueprint_DB
  error?: string
}

export interface GetBlueprintResponse {
  success: boolean
  data?: CourseBlueprint_DB
  error?: string
}
