import client from './client'
import type { InterviewResponse } from './types'

export interface StartInterviewResult {
  interview_id: number
  application_id: number
  job_id: number
  job_title: string
  status: string
  question_id: number
  question: string
  audio_url?: string | null
}

export interface VoiceAnswerResult {
  transcription?: string | null
  transcript?: string | null
  next_question?: string | null
  next_question_text?: string | null
  question?: string | null
  audio_url?: string | null
}

export async function getMyInterviews() {
  const { data } = await client.get<InterviewResponse[]>('/interviews')
  return data
}

export async function getInterview(interviewId: number) {
  const { data } = await client.get<InterviewResponse>(`/interviews/${interviewId}`)
  return data
}

export async function startInterview(applicationId: number) {
  const { data } = await client.post<StartInterviewResult>(`/interviews/start?application_id=${applicationId}`)
  return data
}

export async function completeInterview(interviewId: number) {
  const { data } = await client.post<InterviewResponse>(`/interviews/${interviewId}/complete`)
  return data
}

export async function submitVoiceAnswer(interviewId: number, audioFile: File): Promise<VoiceAnswerResult> {
  const formData = new FormData()
  formData.append('audio', audioFile)

  // Let the browser add the multipart boundary to the Content-Type header.
  const response = await client.post<VoiceAnswerResult>(`/interviews/${interviewId}/voice-answer`, formData, {
    headers: {
      // Remove the JSON default so the browser adds the multipart boundary.
      'Content-Type': undefined,
    },
    skipAuthRedirect: true,
  })

  const data = response.data

  return {
    ...data,
    transcription: data.transcription ?? data.transcript ?? null,
    next_question: data.next_question ?? data.next_question_text ?? data.question ?? null,
  }
}
