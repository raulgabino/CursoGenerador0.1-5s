"use server"

import { createSourceSearchJob, getSourceSearchJobById, updateSourceSearchJob } from "@/lib/source-search-repository"
import { getAndSummarizeSources } from "./source-actions"
import type { CreateSourceSearchJobData } from "@/types/source-search"

/**
 * Initiates a source search job and returns the job ID immediately
 * The actual processing happens asynchronously in the background
 */
export async function initiateSourceSearch(moduleId: string): Promise<{ jobId: string }> {
  try {
    console.log(`[AsyncSourceActions] Initiating source search for module: ${moduleId}`)

    // Create a new job record with PENDING status
    const jobData: CreateSourceSearchJobData = { moduleId }
    const job = await createSourceSearchJob(jobData)

    // Fire-and-forget: Start processing without awaiting
    // This allows the function to return immediately while processing continues in background
    processSourceSearch(job.id).catch((error) => {
      console.error(`[AsyncSourceActions] Background processing failed for job ${job.id}:`, error)
    })

    console.log(`[AsyncSourceActions] Job ${job.id} initiated successfully`)
    return { jobId: job.id }
  } catch (error) {
    console.error(`[AsyncSourceActions] Failed to initiate source search:`, error)
    throw new Error(`Failed to initiate source search: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Processes a source search job in the background
 * This function contains the heavy logic that may take time
 */
export async function processSourceSearch(jobId: string): Promise<void> {
  try {
    console.log(`[AsyncSourceActions] Starting processing for job: ${jobId}`)

    // Get the job from database
    const job = await getSourceSearchJobById(jobId)
    if (!job) {
      console.error(`[AsyncSourceActions] Job ${jobId} not found`)
      return
    }

    // Update status to PROCESSING
    await updateSourceSearchJob(jobId, { status: "PROCESSING" })
    console.log(`[AsyncSourceActions] Job ${jobId} status updated to PROCESSING`)

    try {
      // Execute the heavy AI logic (this is what was causing timeouts)
      console.log(`[AsyncSourceActions] Calling AI service for module: ${job.moduleId}`)
      const results = await getAndSummarizeSources(job.moduleId)

      // Check if the result indicates an error
      if (typeof results === "object" && results.error) {
        // Handle API error response
        await updateSourceSearchJob(jobId, {
          status: "FAILED",
          error: results.error,
        })
        console.log(`[AsyncSourceActions] Job ${jobId} failed with API error: ${results.error}`)
      } else {
        // Success: save results and update status to COMPLETED
        await updateSourceSearchJob(jobId, {
          status: "COMPLETED",
          results: results,
        })
        console.log(`[AsyncSourceActions] Job ${jobId} completed successfully`)
      }
    } catch (aiError) {
      // Handle unexpected errors during AI processing
      const errorMessage = aiError instanceof Error ? aiError.message : "Unknown AI processing error"
      await updateSourceSearchJob(jobId, {
        status: "FAILED",
        error: errorMessage,
      })
      console.error(`[AsyncSourceActions] Job ${jobId} failed with exception:`, aiError)
    }
  } catch (error) {
    console.error(`[AsyncSourceActions] Critical error processing job ${jobId}:`, error)

    // Try to update job status to FAILED if possible
    try {
      await updateSourceSearchJob(jobId, {
        status: "FAILED",
        error: `Critical processing error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } catch (updateError) {
      console.error(`[AsyncSourceActions] Failed to update job status after critical error:`, updateError)
    }
  }
}

/**
 * Retrieves the current state of a source search job
 * Used by frontend to poll for job completion
 */
export async function getSourceSearchJob(jobId: string) {
  try {
    console.log(`[AsyncSourceActions] Retrieving job: ${jobId}`)

    const job = await getSourceSearchJobById(jobId)
    if (!job) {
      return { error: `Job ${jobId} not found` }
    }

    console.log(`[AsyncSourceActions] Job ${jobId} retrieved with status: ${job.status}`)
    return job
  } catch (error) {
    console.error(`[AsyncSourceActions] Error retrieving job ${jobId}:`, error)
    return {
      error: `Failed to retrieve job: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
