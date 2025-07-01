"use server"

import { generatePDF as generatePDFAction } from "@/app/actions/openai-actions"
import type { CourseData } from "@/types/course"

export async function generatePDF(courseData: CourseData): Promise<Blob> {
  console.log("OpenAI service: Calling generatePDFAction")
  try {
    return await generatePDFAction(courseData)
  } catch (error) {
    console.error("OpenAI service: Error in generatePDF:", error)
    throw error // Re-throw to allow proper error handling in UI
  }
}

