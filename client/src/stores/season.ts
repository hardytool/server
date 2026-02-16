import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Season {
  id: number
  number: number
  name: string
  active: boolean
  activity_check: boolean
  registration_open: boolean
}

export const useSeasonStore = defineStore('season', () => {
  const activeSeason = ref<Season | null>(null)
  const loaded = ref(false)

  async function fetchActiveSeason(): Promise<void> {
    if (loaded.value) return
    try {
      const res = await fetch('/api/v1/seasons')
      if (!res.ok) return
      const seasons = await res.json() as Season[]
      activeSeason.value = seasons.find(s => s.active) ?? null
    } catch (_err) {
      activeSeason.value = null
    } finally {
      loaded.value = true
    }
  }

  return { activeSeason, loaded, fetchActiveSeason }
})
