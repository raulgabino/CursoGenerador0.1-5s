export interface CourseModule {
  id: string
  title: string
  description: string
  duration: string
  objectives: string[]
  topics: string[]
}

export interface CourseData {
  title: string
  audience?: string
  modality?: string
  duration?: string
  certificate: boolean
  problem?: string
  purpose?: string
  experience?: string

  // CRÍTICO: Asegurar que structure sea siempre CourseModule[]
  structure: CourseModule[]

  evaluationMethod?: string
  evaluationType?: string
  materials?: string
  additionalMaterials: boolean
  additionalMaterialsContent?: string
  lastScreen?: number
  location?: string
  platform?: string
  theoreticalContext?: string
  practicalContext?: string
}
