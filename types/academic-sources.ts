export interface AcademicArticle {
  id: string
  title: string
  authors: string[]
  year: string | null
  urlToPdf: string
  source: "CORE" | "arXiv"
  summary?: string
}

export interface ArticleWithExplanation extends AcademicArticle {
  explanation?: string
  isLoadingExplanation?: boolean
}

export interface SearchSourcesRequest {
  courseTitle: string
  moduleName: string
  moduleDescription: string
}

export interface ExplainArticleRequest {
  title: string
  authors: string[]
  urlToPdf: string
  courseTitle: string
  moduleName: string
  summary?: string
}

export interface SearchSourcesResponse {
  success: boolean
  data?: AcademicArticle[]
  error?: string
}

export interface ExplainArticleResponse {
  success: boolean
  data?: {
    explanation: string
  }
  error?: string
}
