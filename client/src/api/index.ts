// Thin wrappers around the existing /api/v1 endpoints.
// All fetch calls are relative so they work regardless of deploy origin.

export interface Season {
  id: number
  name: string
}

export interface Division {
  id: number
  name: string
  season_id: number
  discord_url: string | null
}

export interface DivisionDetail extends Division {
  admins: { steam_id: string; name: string }[]
}

export interface Player {
  id: number
  steam_id: string
  name: string
  mmr: number
  adjusted_mmr: number
  is_captain: boolean
  is_standin: boolean
  roles: { role_id: number; rank: number }[]
}

export interface Captain {
  steam_id: string
  name: string
  mmr: number
  adjusted_mmr: number
}

export type MeResponse =
  | { loggedIn: false }
  | {
      loggedIn: true
      steamId: string
      displayName: string
      avatar: string
      isAdmin: boolean
      activityCheckRequired: boolean
    }

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// Fetches a fresh CSRF token then performs a JSON POST.
// The server accepts the token via the x-csrf-token header.
async function post<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const { token } = await get<{ token: string }>('/api/v1/csrf')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  me: () => get<MeResponse>('/api/v1/me'),
  seasons: {
    list: () => get<Season[]>('/api/v1/seasons'),
    get: (id: number) => get<Season>(`/api/v1/seasons/${id}`),
  },
  divisions: {
    list: () => get<Division[]>('/api/v1/divisions'),
    get: (id: number) => get<DivisionDetail>(`/api/v1/divisions/${id}`),
    players: (seasonId: number, divisionId: number) =>
      get<Player[]>(`/api/v1/seasons/${seasonId}/divisions/${divisionId}/players`),
    captains: (seasonId: number, divisionId: number) =>
      get<Captain[]>(`/api/v1/seasons/${seasonId}/divisions/${divisionId}/captains`),
  },
  post,
}
