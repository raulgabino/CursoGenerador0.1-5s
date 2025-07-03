export interface SourceSearchJob {
  id: string
  moduleId: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  results: any | null
  error: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateSourceSearchJobData {
  moduleId: string
}
