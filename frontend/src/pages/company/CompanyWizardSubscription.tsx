import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function CompanyWizardSubscription() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/company/dashboard', { replace: true })
      return
    }

    navigate('/company/register/profile', { replace: true })
  }, [navigate, user])

  return null
}
