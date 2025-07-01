import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // In a real implementation, you would serve an actual Elon Musk image
  // For now, we'll redirect to a placeholder
  return NextResponse.redirect("https://placeholder.svg?height=64&width=64")
}
