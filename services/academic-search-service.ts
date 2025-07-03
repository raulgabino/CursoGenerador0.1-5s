"use server"

// services/academic-search-service.ts
export interface AcademicSource {
  title: string
  authors: string[]
  year: string | null
  url: string
  summary?: string
  source: "CORE" | "arXiv"
}

// Función de fetch con timeout para abortar peticiones largas
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  })
  clearTimeout(id)
  return response
}

// Búsqueda en CORE, ahora con timeout y logging
async function searchCore(query: string): Promise<AcademicSource[]> {
  const CORE_API_KEY = process.env.CORE_API_KEY
  if (!CORE_API_KEY) {
    console.warn("CORE API key not found. Skipping CORE search.")
    return []
  }

  console.log(`[AcademicSearch] Iniciando búsqueda en CORE para: "${query}"`)
  try {
    const response = await fetchWithTimeout(
      "https://api.core.ac.uk/v3/search/works",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CORE_API_KEY}`,
        },
        body: JSON.stringify({ q: query, limit: 5 }),
      },
      7000,
    ) // Timeout estricto de 7 segundos

    if (!response.ok) {
      console.error(`[AcademicSearch] CORE API error: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()
    console.log(`[AcademicSearch] Búsqueda en CORE completada.`)
    return data.results.map(
      (item: any): AcademicSource => ({
        title: item.title,
        authors: item.authors || [],
        year: item.yearPublished?.toString() || null,
        url: item.downloadUrl || `https://core.ac.uk/work/${item.id}`,
        summary: item.abstract,
        source: "CORE",
      }),
    )
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[AcademicSearch] La petición a CORE ha excedido el tiempo de espera.")
    } else {
      console.error("[AcademicSearch] Fallo al contactar la API de CORE:", error)
    }
    return []
  }
}

// Búsqueda en arXiv, ahora con timeout y logging
async function searchArxiv(query: string): Promise<AcademicSource[]> {
  console.log(`[AcademicSearch] Iniciando búsqueda en arXiv para: "${query}"`)
  try {
    const searchQuery = `ti:"${query}" OR abs:"${query}"`
    const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}&sortBy=relevance&sortOrder=descending&max_results=5`
    const response = await fetchWithTimeout(url, {}, 7000) // Timeout estricto de 7 segundos
    const text = await response.text()
    console.log(`[AcademicSearch] Búsqueda en arXiv completada.`)

    const entries = text.split("<entry>")
    entries.shift()

    return entries
      .map((entry: string): AcademicSource | null => {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
        const urlMatch = entry.match(/<id>([\s\S]*?)<\/id>/)
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/)
        const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/)
        const authorMatches = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)]

        if (!titleMatch || !urlMatch) return null

        return {
          title: titleMatch[1].replace(/\n\s*/g, " ").trim(),
          authors: authorMatches.map((match) => match[1]),
          year: publishedMatch ? new Date(publishedMatch[1]).getFullYear().toString() : null,
          url: urlMatch[1],
          summary: summaryMatch ? summaryMatch[1].replace(/\n\s*/g, " ").trim() : undefined,
          source: "arXiv",
        }
      })
      .filter((item): item is AcademicSource => item !== null)
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[AcademicSearch] La petición a arXiv ha excedido el tiempo de espera.")
    } else {
      console.error("[AcademicSearch] Fallo al contactar la API de arXiv:", error)
    }
    return []
  }
}

// Función orquestadora principal
export async function findAcademicSources(query: string): Promise<AcademicSource[]> {
  console.log(`[AcademicSearch] Orquestando búsquedas académicas para: "${query}"`)
  const [coreResults, arxivResults] = await Promise.all([searchCore(query), searchArxiv(query)])

  const allResults = [...coreResults, ...arxivResults]
  const uniqueResults = Array.from(new Map(allResults.map((item) => [item.title.toLowerCase(), item])).values())

  console.log(`[AcademicSearch] Búsquedas combinadas. Encontrados ${uniqueResults.length} resultados únicos.`)
  return uniqueResults
}
