"use server"

import type { SourceSearchJob, CreateSourceSearchJobData } from "@/types/source-search"

// In-memory storage that simulates a database
// In a real application, this would be replaced with actual database calls
const sourceSearchJobs = new Map<string, SourceSearchJob>()

// Generate a unique ID for jobs
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function createSourceSearchJob(data: CreateSourceSearchJobData): Promise<SourceSearchJob> {
  const now = new Date()
  const job: SourceSearchJob = {
    id: generateJobId(),
    moduleId: data.moduleId,
    status: "PENDING",
    results: null,
    error: null,
    createdAt: now,
    updatedAt: now,
  }

  sourceSearchJobs.set(job.id, job)
  console.log(`[SourceSearchRepository] Created job ${job.id} for module ${job.moduleId}`)

  return job
}

export async function getSourceSearchJobById(jobId: string): Promise<SourceSearchJob | null> {
  const job = sourceSearchJobs.get(jobId)
  if (!job) {
    console.log(`[SourceSearchRepository] Job ${jobId} not found`)
    return null
  }

  console.log(`[SourceSearchRepository] Retrieved job ${jobId} with status ${job.status}`)
  return job
}

export async function updateSourceSearchJob(
  jobId: string,
  updates: Partial<Omit<SourceSearchJob, "id" | "createdAt">>,
): Promise<SourceSearchJob | null> {
  const job = sourceSearchJobs.get(jobId)
  if (!job) {
    console.log(`[SourceSearchRepository] Cannot update job ${jobId} - not found`)
    return null
  }

  const updatedJob: SourceSearchJob = {
    ...job,
    ...updates,
    updatedAt: new Date(),
  }

  sourceSearchJobs.set(jobId, updatedJob)
  console.log(`[SourceSearchRepository] Updated job ${jobId} with status ${updatedJob.status}`)

  return updatedJob
}

// Utility function to get all jobs (for debugging purposes)
export async function getAllSourceSearchJobs(): Promise<SourceSearchJob[]> {
  return Array.from(sourceSearchJobs.values())
}

// Utility function to clear all jobs (for testing purposes)
export async function clearAllSourceSearchJobs(): Promise<void> {
  sourceSearchJobs.clear()
  console.log(`[SourceSearchRepository] Cleared all jobs`)
}
