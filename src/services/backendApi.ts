import type { AuthSession, AuthUser, ClimateSnapshot, RealtimeAlert } from '../types/climate'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'
const AUTH_TOKEN_STORAGE_KEY = 'india-climate-auth-token'

interface BackendError {
  error?: string
}

interface AlertsResponse {
  alerts: RealtimeAlert[]
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as BackendError
    throw new Error(payload.error ?? 'Backend request failed')
  }

  return (await response.json()) as T
}

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function storeAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function clearStoredAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  return requestJson<AuthSession>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function loginUser(email: string, password: string): Promise<AuthSession> {
  return requestJson<AuthSession>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchCurrentUser(token: string): Promise<AuthUser> {
  return requestJson<AuthUser>('/api/auth/me', {}, token)
}

export function fetchBackendClimateSnapshot(cityId: string): Promise<ClimateSnapshot> {
  return requestJson<ClimateSnapshot>(
    `/api/climate/snapshot?cityId=${encodeURIComponent(cityId)}`,
  )
}

export async function fetchBackendRealtimeAlerts(
  cityId: string,
): Promise<RealtimeAlert[]> {
  const payload = await requestJson<AlertsResponse>(
    `/api/alerts/realtime?cityId=${encodeURIComponent(cityId)}`,
  )

  return payload.alerts
}
