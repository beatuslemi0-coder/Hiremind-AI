export type UserRole = 'interviewee' | 'employer'

export interface UserResponse {
  id: number
  username: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface CandidateProfileCreate {
  phone_number?: string | null
  location?: string | null
}

export interface CandidateProfileResponse extends CandidateProfileCreate {
  id: number
  user_id: number
}

export interface EducationCreate {
  education_level: string
  institution: string
  field_of_study: string
  start_year: number
  end_year?: number | null
}

export interface EducationResponse extends EducationCreate {
  id: number
  profile_id: number
}

export interface WorkExperienceCreate {
  job_title: string
  company_name: string
  description?: string | null
  start_date: string
  end_date?: string | null
  currently_working: boolean
}

export interface WorkExperienceResponse extends WorkExperienceCreate {
  id: number
  profile_id: number
}

export interface JobResponse {
  id: number
  employer_id: number
  title: string
  description: string
  location: string
  employment_type: string
  education_required?: string | null
  experience_required?: number | null
  skills_required?: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface ApplicationResponse {
  id: number
  job_id: number
  candidate_id: number
  status: string
  applied_at: string
}

export interface InterviewResponse {
  id: number
  user_id: number
  application_id: number | null
  status: string
}
