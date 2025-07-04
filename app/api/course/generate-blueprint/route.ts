import { type NextRequest, NextResponse } from "next/server"
import { generateTextWithAI } from "@/services/unified-ai-service"
import type { GenerateBlueprintRequest, CourseBlueprint, GenerateBlueprintResponse } from "@/types/course-blueprint"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateBlueprintRequest = await request.json()

    // Validate required fields
    const requiredFields: (keyof GenerateBlueprintRequest)[] = [
      "topic",
      "audience",
      "modality",
      "totalHours",
      "prerequisites",
      "availableResources",
      "expectedResult",
    ]

    const missingFields = requiredFields.filter((field) => {
      const value = body[field]
      return value === undefined || value === null || value === ""
    })

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        } as GenerateBlueprintResponse,
        { status: 400 },
      )
    }

    // Validate totalHours is a positive number
    if (typeof body.totalHours !== "number" || body.totalHours <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "totalHours must be a positive number",
        } as GenerateBlueprintResponse,
        { status: 400 },
      )
    }

    // Calculate maximum number of modules (totalHours / 4, rounded up)
    const maxModules = Math.ceil(body.totalHours / 4)

    // Create system prompt
    const systemPrompt = `You are an Instructional-DesignerGPT, an expert in creating structured educational courses. Your task is to generate a comprehensive course blueprint based on the provided requirements.

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY a valid JSON object, no additional text, explanations, or formatting.
2. The maximum number of modules is ${maxModules} (calculated as totalHours / 4, rounded up).
3. All learning outcomes and module outcomes must be measurable and specific (use action verbs like "apply", "analyze", "create", "evaluate").
4. Activities must be practical, hands-on actions that students will perform.
5. Assessments must be specific methods to verify the module outcomes.

JSON SCHEMA (you must follow this exact structure):
{
  "courseTitle": "string",
  "totalHours": number,
  "learningOutcomes": ["string"],
  "modules": [
    {
      "moduleName": "string",
      "moduleHours": number,
      "moduleOutcomes": ["string"],
      "activities": ["string"],
      "assessments": ["string"]
    }
  ],
  "prework": ["string"],
  "requiredResources": ["string"]
}

REQUIREMENTS:
- learningOutcomes: 3-5 measurable course-level objectives
- modules: ${maxModules} modules maximum, each with 2-4 hours minimum
- moduleOutcomes: 2-3 specific, measurable objectives per module
- activities: 3-5 practical activities per module
- assessments: 2-3 assessment methods per module
- prework: 2-4 preparatory tasks students should complete before the course
- requiredResources: 3-6 essential resources needed for the course

Remember: Respond with ONLY the JSON object, nothing else.`

    // Create user prompt with the input data
    const userPrompt = `Generate a course blueprint with the following specifications:

Topic: ${body.topic}
Target Audience: ${body.audience}
Modality: ${body.modality}
Total Hours: ${body.totalHours}
Prerequisites: ${body.prerequisites}
Available Resources: ${body.availableResources}
Expected Result: ${body.expectedResult}

Generate the course blueprint following the JSON schema provided in the system prompt.`

    console.log(`[BlueprintAPI] Generating blueprint for topic: ${body.topic}`)

    // Call the unified AI service
    const result = await generateTextWithAI(userPrompt, systemPrompt, {
      provider: "openai", // Prefer OpenAI for structured JSON output
      fallbackProviders: ["cohere", "anthropic", "google"],
      maxTokens: 3000,
      temperature: 0.3, // Lower temperature for more consistent structure
    })

    console.log(`[BlueprintAPI] AI response received from ${result.provider}`)

    // Parse the JSON response
    let blueprint: CourseBlueprint
    try {
      // Clean the response in case there's any extra formatting
      const cleanedResponse = result.text.trim()

      // Remove any potential markdown code blocks
      const jsonMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : cleanedResponse

      blueprint = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("[BlueprintAPI] Failed to parse AI response as JSON:", parseError)
      console.error("[BlueprintAPI] Raw response:", result.text)

      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate valid course blueprint. Please try again.",
        } as GenerateBlueprintResponse,
        { status: 500 },
      )
    }

    // Validate the parsed blueprint has required structure
    if (!blueprint.courseTitle || !blueprint.modules || !Array.isArray(blueprint.modules)) {
      console.error("[BlueprintAPI] Invalid blueprint structure:", blueprint)

      return NextResponse.json(
        {
          success: false,
          error: "Generated blueprint has invalid structure. Please try again.",
        } as GenerateBlueprintResponse,
        { status: 500 },
      )
    }

    // Additional validation: ensure totalHours matches input
    blueprint.totalHours = body.totalHours

    // Ensure modules don't exceed the maximum
    if (blueprint.modules.length > maxModules) {
      blueprint.modules = blueprint.modules.slice(0, maxModules)
    }

    console.log(`[BlueprintAPI] Blueprint generated successfully with ${blueprint.modules.length} modules`)

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: blueprint,
      } as GenerateBlueprintResponse,
      { status: 200 },
    )
  } catch (error) {
    console.error("[BlueprintAPI] Unexpected error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while generating course blueprint",
      } as GenerateBlueprintResponse,
      { status: 500 },
    )
  }
}
