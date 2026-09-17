import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getMyApplications, getJob } from '../../api/applicationApi'
import { startInterview } from '../../api/interviewApi'
import { useAuth } from '../../context/AuthContext'

type InterviewItem = {
  applicationId: number
  title: string
  company: string
  status: string
}

export function CandidateInterviewMatches() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1$/, '')

  function normalizeAudioUrl(audioUrl?: string | null) {
    if (!audioUrl) return null
    if (/^https?:\/\//i.test(audioUrl)) return audioUrl
    return new URL(audioUrl, `${backendBaseUrl}/`).toString()
  }

  const [interviews, setInterviews] = useState<InterviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function getApiError(error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { detail?: string } } }).response
      return response?.data?.detail ?? null
    }
    return null
  }

  async function loadInterviews() {
    setLoading(true)
    try {
      const applications = await getMyApplications()
      const mapped = await Promise.all(
        applications.map(async (application) => {
          const job = await getJob(application.job_id)
          return {
            applicationId: application.id,
            title: job.title,
            company: job.location,
            status: application.status,
          }
        }),
      )
      setInterviews(mapped)
    } catch (error) {
      console.error(error)
      setError(getApiError(error) ?? t('common.error', 'Unable to load interviews. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInterviews()
  }, [])

  async function beginInterview(interview: InterviewItem) {
    setError(null)
    try {
      const result = await startInterview(interview.applicationId)
      const sessionState = {
        interviewId: result.interview_id,
        title: result.job_title,
        question: result.question,
        audioUrl: normalizeAudioUrl(result.audio_url),
      }

      window.localStorage.setItem('vox_active_interview', JSON.stringify(sessionState))

      navigate('/candidate/interview', {
        replace: true,
        state: sessionState,
      })
    } catch (error) {
      console.error(error)
      setError(getApiError(error) ?? t('common.error', 'Unable to start the interview. Please try again.'))
    }
  }

  if (!user) {
    navigate('/candidate/register/profile', { replace: true })
    return null
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">{t('wizard.interviews.title', 'Interviews matched for you')}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {t('wizard.interviews.matchedOn', 'Matched to your profession and education')}
        </p>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="text-on-surface-variant">{t('common.loading', 'Loading...')}</p>
      ) : interviews.length === 0 ? (
        <p className="text-on-surface-variant">{t('wizard.interviews.noResults', 'No matching interviews right now. Check back later.')}</p>
      ) : (
        <ul className="space-y-3">
          {interviews.map((interview) => (
            <li
              key={interview.applicationId}
              className="flex items-center justify-between rounded-[20px] border border-white/40 bg-white/80 p-4 shadow-soft backdrop-blur-md"
            >
              <div>
                <p className="font-semibold text-on-surface">{interview.title}</p>
                <p className="text-sm text-on-surface-variant">
                  {interview.company} — {interview.status}
                </p>
              </div>
              <button
                onClick={() => beginInterview(interview)}
                disabled={!['pending', 'shortlisted', 'accepted'].includes(interview.status)}
                title={!['pending', 'shortlisted', 'accepted'].includes(interview.status) ? t('wizard.interviews.unavailable', 'This application is not available for an interview.') : undefined}
                className="btn btn-primary disabled:opacity-50"
              >
                {['pending', 'shortlisted', 'accepted'].includes(interview.status)
                  ? t('wizard.interviews.start', 'Start interview')
                  : t('wizard.interviews.unavailable', 'Interview unavailable')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
