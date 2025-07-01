// Utilidades para guardar y recuperar datos del curso en localStorage
export const COURSE_DATA_KEY = "whorkshop_course_data"

// Improve the saveCourseData function with better error handling
export function saveCourseData(data: any): void {
  if (typeof window === "undefined") {
    return // Do nothing on the server
  }

  try {
    // Make sure data is valid before saving
    if (!data) {
      console.error("Attempted to save null or undefined data")
      return
    }

    // Create a safe copy of the data to avoid circular references
    const safeData = JSON.parse(JSON.stringify(data))
    localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(safeData))
  } catch (error) {
    console.error("Error saving course data:", error)
    // Try to save minimal data if full save fails
    try {
      const minimalData = {
        title: data.title || "",
        lastScreen: data.lastScreen || 1,
      }
      localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(minimalData))
    } catch (fallbackError) {
      console.error("Failed even minimal data save:", fallbackError)
    }
  }
}

// Improve the loadCourseData function with better error handling
export function loadCourseData(): any | null {
  if (typeof window === "undefined") {
    return null // Return null on the server
  }

  try {
    const savedData = localStorage.getItem(COURSE_DATA_KEY)
    if (!savedData) return null

    // Try to parse the JSON
    try {
      const parsedData = JSON.parse(savedData)

      // Validate the parsed data has at least some expected properties
      if (typeof parsedData !== "object" || parsedData === null) {
        throw new Error("Invalid data format")
      }

      return parsedData
    } catch (parseError) {
      console.error("Error parsing saved data:", parseError)
      // If there's a parsing error, remove the corrupted data
      localStorage.removeItem(COURSE_DATA_KEY)
      return null
    }
  } catch (error) {
    console.error("Error loading course data:", error)
    return null
  }
}

export function clearCourseData(): void {
  if (typeof window === "undefined") {
    return // No hacer nada en el servidor
  }

  try {
    localStorage.removeItem(COURSE_DATA_KEY)
  } catch (error) {
    console.error("Error al limpiar datos del curso:", error)
  }
}
