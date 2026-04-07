interface AuthResponse {
  access_token: string
}

export interface EventItem {
  id: number
  type: string
  name: string
  description: string
  location: string
  startDateTime: string
  endDateTime: string
}
interface EventsResponse {
  events: EventItem[]
}

const AUTH_URL =
  '/auth-api/auth/realms/EduPowerKeycloak/protocol/openid-connect/token'
const EVENTS_URL = '/platform-api/services/21-school/api/v1/events'

export const authenticate = async (): Promise<string> => {
  const username = import.meta.env.VITE_S21_LOGIN?.trim()
  const password = import.meta.env.VITE_S21_PASSWORD?.trim()

  if (!username || !password) {
    throw new Error(
      'Missing credentials: set VITE_S21_LOGIN and VITE_S21_PASSWORD in .env',
    )
  }
  const params = new URLSearchParams()
  params.append('client_id', 's21-open-api')
  params.append('grant_type', 'password')
  params.append('username', username)
  params.append('password', password)
  const requestBody = params.toString()

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody,
  })

  const responseText = await response.text()

  if (!response.ok) {
    console.error('Auth error payload:', responseText)
    throw new Error(`Auth failed: ${response.status} ${response.statusText}`)
  }

  const data = JSON.parse(responseText) as Partial<AuthResponse>
  if (!data.access_token) {
    throw new Error('Auth succeeded without access token')
  }

  return data.access_token
}

export const fetchEvents = async (token: string): Promise<EventItem[]> => {
  const fromDate = new Date()
  const toDate = new Date(fromDate)
  toDate.setDate(toDate.getDate() + 7)

  const url = new URL(EVENTS_URL, window.location.origin)
  url.searchParams.set('from', fromDate.toISOString())
  url.searchParams.set('to', toDate.toISOString())
  url.searchParams.set('limit', '50')

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const responseText = await response.text()
    console.error('Events error payload:', responseText)
    throw new Error(`Events failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as EventsResponse

  return data.events
}
