"use server"

import type { CourseData } from "@/types/course"

// This simulates what would be a call to the Grok API
export async function generateCourseRoast(courseData: CourseData): Promise<string> {
  if (!courseData || !courseData.title) {
    return "Oh, brilliant, no course to roast. What's next, a workshop on breathing? Upload something, or are you too busy failing at Mars colonization?"
  }

  try {
    // In a real implementation, this would be an API call to Grok
    // For now, we'll simulate the response with pre-written templates and course data

    const templates = [
      `"${courseData.title}"? Seriously? ${courseData.duration || "However long this takes"} to grasp what my xAI nerds solve while napping in a Tesla. ${courseData.audience ? `Aimed at ${courseData.audience}? Perfect for people who think 'algorithm' is a dance move.` : "No audience specified—perfect for teaching to empty chairs."} This is dumber than a SpaceX intern's first launch attempt. Thanks to v0.dev for building me to mock this tragedy—enjoy your 'skills,' you primitive Earth slugs!`,

      `Ah, "${courseData.title}" – the educational equivalent of trying to land a rocket on a barge... sideways. ${courseData.duration ? `${courseData.duration} of my life I'll never get back.` : "No duration listed? Probably because time stops when boredom reaches escape velocity."} ${courseData.problem ? `Solving "${courseData.problem}" is like fixing traffic with underground tunnels—sounds brilliant until someone does the math.` : "At least specify a problem you're solving, or is that too much rocket science for you?"} I've seen more innovation in a government committee meeting.`,

      `"${courseData.title}" makes my Cybertruck prototype look like a finished product. ${courseData.structure ? `Your structure of "${courseData.structure.split("\n")[0]}..." is as stable as Dogecoin after one of my tweets.` : "No structure? Chaos isn't a methodology, despite what my Twitter feed suggests."} ${courseData.evaluationMethod ? `And your evaluation method? "${courseData.evaluationMethod.substring(0, 40)}..." Adorable. Like watching a child try to explain quantum physics.` : "No evaluation method? Just vibes, I guess. Very scientific."} This course has the same chance of success as my first three rockets.`,
    ]

    // Select a random template
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return randomTemplate
  } catch (error) {
    console.error("Error generating course roast:", error)
    return "Even my AI can't roast this disaster of a course. And I've seen some truly spectacular failures—I own Twitter, remember? Try again when you've got something worth my sarcastic brilliance. v0.dev deserves better input than... whatever this was."
  }
}
