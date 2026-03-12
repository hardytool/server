const BASE_URL = 'https://api.opendota.com/api'

export async function getMedal(steamId: string): Promise<number> {
  const response = await fetch(`${BASE_URL}/players/${steamId}`)
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status}`)
  }
  const data = await response.json() as { rank_tier?: number | null }
  return data.rank_tier ?? 0
}
