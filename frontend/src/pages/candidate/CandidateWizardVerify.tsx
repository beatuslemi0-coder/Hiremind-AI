import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function CandidateWizardVerify() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/candidate/register/education', { replace: true })
  }, [navigate])

  return null
}
