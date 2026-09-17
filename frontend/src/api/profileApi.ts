import client from './client'
import type {
  CandidateProfileCreate,
  CandidateProfileResponse,
  EducationCreate,
  EducationResponse,
  WorkExperienceCreate,
  WorkExperienceResponse,
} from './types'

export async function getProfile() {
  const { data } = await client.get<CandidateProfileResponse>('/profile')
  return data
}

export async function createProfile(payload: CandidateProfileCreate) {
  const { data } = await client.post<CandidateProfileResponse>('/profile', payload)
  return data
}

export async function updateProfile(payload: CandidateProfileCreate) {
  const { data } = await client.put<CandidateProfileResponse>('/profile', payload)
  return data
}

export async function getEducation() {
  const { data } = await client.get<EducationResponse[]>('/profile/education')
  return data
}

export async function createEducation(payload: EducationCreate) {
  const { data } = await client.post<EducationResponse>('/profile/education', payload)
  return data
}

export async function updateEducation(id: number, payload: EducationCreate) {
  const { data } = await client.put<EducationResponse>(`/profile/education/${id}`, payload)
  return data
}

export async function deleteEducation(id: number) {
  await client.delete(`/profile/education/${id}`)
}

export async function getWorkExperience() {
  const { data } = await client.get<WorkExperienceResponse[]>('/profile/experience')
  return data
}

export async function createWorkExperience(payload: WorkExperienceCreate) {
  const { data } = await client.post<WorkExperienceResponse>('/profile/experience', payload)
  return data
}

export async function updateWorkExperience(id: number, payload: WorkExperienceCreate) {
  const { data } = await client.put<WorkExperienceResponse>(`/profile/experience/${id}`, payload)
  return data
}

export async function deleteWorkExperience(id: number) {
  await client.delete(`/profile/experience/${id}`)
}
