// Request types
export interface GenerateBlueprintRequest {
  topic: string
  audience: string
  modality: string
  totalHours: number
  prerequisites: string
  availableResources: string
  expectedResult: string
}

// Response types
export interface CourseModule {
  moduleName: string
  moduleHours: number
  moduleOutcomes: string[]
  activities: string[]
  assessments: string[]
}

export interface CourseBlueprint {
  courseTitle: string
  totalHours: number
  learningOutcomes: string[]
  modules: CourseModule[]
  prework: string[]
  requiredResources: string[]
}

// API Response wrapper
export interface GenerateBlueprintResponse {
  success: boolean
  data?: CourseBlueprint
  error?: string
}
