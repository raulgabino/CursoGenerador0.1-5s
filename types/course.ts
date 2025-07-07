export interface CourseModule {
  moduleName: string
  moduleDescription: string
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

  // CRÍTICO: Verificar que todos los componentes usen esta definición
  structure?: CourseModule[] // NO string

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
