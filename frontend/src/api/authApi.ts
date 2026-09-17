import client, { setAuthToken } from './client'
import type { TokenResponse, UserResponse } from './types'

export interface LoginResult extends TokenResponse {
  user: UserResponse
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)

  const { data } = await client.post<TokenResponse>('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  setAuthToken(data.access_token)

  const { data: user } = await client.get<UserResponse>('/auth/me')

  return {
    ...data,
    user,
  }
}

export async function registerUser(payload: {
  username: string
  email: string
  password: string
  role: 'interviewee' | 'employer'
}) {
  return client.post('/auth/register', payload)
}

export async function getCurrentUser() {
  const { data } = await client.get<UserResponse>('/auth/me')
  return data
}
