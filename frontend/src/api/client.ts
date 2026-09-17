import axios from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setAuthToken(token: string | null) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`
    window.localStorage.setItem('auth_token', token)
  } else {
    delete client.defaults.headers.common.Authorization
    window.localStorage.removeItem('auth_token')
  }
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestConfig = error.config
    if (error.response?.status === 401 && !requestConfig?.skipAuthRedirect) {
      setAuthToken(null)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)

const savedToken = window.localStorage.getItem('auth_token')
if (savedToken) setAuthToken(savedToken)

export default client
