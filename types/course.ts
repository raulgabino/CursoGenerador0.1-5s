export interface CourseModule {
  moduleName: string
  moduleDescription: string
}

export interface CourseData {
  // Información básica
  title: string
  audience: string
  problem: string
  purpose: string

  // Contexto de expertos
  theoreticalContext?: string
  practicalContext?: string

  // Estructura como array de objetos (NO como string)
  structure?: CourseModule[]

  // Otros campos
  materials?: string
  additionalMaterials?: boolean
  evaluation?: string

  // Campos adicionales para el blueprint
  duration?: number
  difficulty?: string
  prerequisites?: string
  objectives?: string[]
}

export interface ExpertContext {
  theoreticalContext: string
  practicalContext: string
}
