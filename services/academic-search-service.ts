"use server"

// Define una estructura unificada para los resultados de ambas APIs
export interface AcademicSource {
  title: string
  authors: string[]
  year: string | null
  url: string
  summary?: string
  source: "CORE" | "arXiv"
}

// Función para buscar en la API de CORE
async function searchCore(query: string): Promise<AcademicSource[]> {
  const CORE_API_KEY = process.env.CORE_API_KEY
  if (!CORE_API_KEY) {
    console.warn("CORE API key not found. Skipping CORE search.")
    return []
  }

  try {
    const response = await fetch("https://api.core.ac.uk/v3/search/works", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CORE_API_KEY}`,
      },
      body: JSON.stringify({
        q: query,
        limit: 5, // Pedimos 5 para tener opciones
      }),
    })

    if (!response.ok) {
      console.error(`CORE API error: ${response.statusText}`)
      return []
    }

    const data = await response.json()
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
  } catch (error) {
    console.error("Failed to fetch from CORE API:", error)
    return []
  }
}

// Función para buscar en la API de arXiv
async function searchArxiv(query: string): Promise<AcademicSource[]> {
  try {
    // arXiv usa 'ti' para título y 'abs' para resumen en su query
    const searchQuery = `ti:"${query}" OR abs:"${query}"`
    const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(
      searchQuery,
    )}&sortBy=relevance&sortOrder=descending&max_results=5`

    const response = await fetch(url)
    const text = await response.text()

    // El parsing de XML puede ser complejo, usamos regex para una extracción simple
    const entries = text.split("<entry>")
    entries.shift() // Remove the part before the first entry

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
  } catch (error) {
    console.error("Failed to fetch from arXiv API:", error)
    return []
  }
}

// Función orquestadora que llama a ambas APIs
export async function findAcademicSources(query: string): Promise<AcademicSource[]> {
  const [coreResults, arxivResults] = await Promise.all([searchCore(query), searchArxiv(query)])

  // Combinar y eliminar duplicados simples por título
  const allResults = [...coreResults, ...arxivResults]
  const uniqueResults = Array.from(new Map(allResults.map((item) => [item.title.toLowerCase(), item])).values())

  return uniqueResults
}
