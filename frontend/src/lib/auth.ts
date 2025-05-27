import { fetcher } from './api'

export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
}

export interface TokenRefreshResponse {
  access: string
}

// Token utils
export const getAccessToken = (): string | null =>
  localStorage.getItem('access_token')

export const getRefreshToken = (): string | null =>
  localStorage.getItem('refresh_token')

export const setTokens = (access: string, refresh: string): void => {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export const clearTokens = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export const isAuthenticated = (): boolean => {
  const token = getAccessToken()
  if (!token) return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp > currentTime
  } catch {
    return false
  }
}

// Auto-refresh fetcher
export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')

  const response = await fetcher<TokenRefreshResponse>('/user/token/refresh/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  })

  localStorage.setItem('access_token', response.access)
  return response.access
}

export const authenticatedFetcher = async <T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  let token = getAccessToken()
  if (!token) throw new Error('No access token')

  const makeRequest = async (accessToken: string): Promise<T> =>
    fetcher<T>(path, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })

  try {
    return await makeRequest(token)
  } catch (err) {
    if (err instanceof Error && err.message.includes('401')) {
      try {
        token = await refreshAccessToken()
        return await makeRequest(token)
      } catch {
        clearTokens()
        window.location.href = '/login'
        throw new Error('Session expired. Please log in again.')
      }
    }
    throw err
  }
}

// Current user
export const getCurrentUser = async (): Promise<User> => {
  return authenticatedFetcher<User>('/user/profile/')
}

// Registration
export const register = async (
  username: string,
  email: string,
  password: string
): Promise<void> => {
  await fetcher('/user/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
}
