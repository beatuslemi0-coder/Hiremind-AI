import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function CompanyWizardPersonal() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/company/register/profile', { replace: true })
  }, [navigate])

  return null
}
