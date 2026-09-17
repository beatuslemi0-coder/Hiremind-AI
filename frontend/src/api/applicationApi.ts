import client from './client'
import type { ApplicationResponse, JobResponse } from './types'

export async function getJobs() {
  const { data } = await client.get<JobResponse[]>('/jobs')
  return data
}

export async function getJob(jobId: number) {
  const { data } = await client.get<JobResponse>(`/jobs/${jobId}`)
  return data
}

export async function getMyJobs() {
  const { data } = await client.get<JobResponse[]>('/jobs/employer/my-jobs')
  return data
}

export async function getJobApplicants(jobId: number) {
  const { data } = await client.get<ApplicationResponse[]>(`/applications/job/${jobId}`)
  return data
}

export async function createJob(payload: {
  title: string
  description: string
  location: string
  employment_type: string
  education_required?: string | null
  experience_required?: number | null
  skills_required?: string | null
}) {
  const { data } = await client.post<JobResponse>('/jobs', payload)
  return data
}

export async function getMyApplications() {
  const { data } = await client.get<ApplicationResponse[]>('/applications/my-applications')
  return data
}

export async function applyForJob(jobId: number) {
  const { data } = await client.post<ApplicationResponse>('/applications', { job_id: jobId })
  return data
}

export async function updateApplicationStatus(applicationId: number, status: string) {
  const { data } = await client.put<ApplicationResponse>(`/applications/${applicationId}/status`, { status })
  return data
}

export async function withdrawApplication(applicationId: number) {
  await client.delete(`/applications/${applicationId}`)
}
