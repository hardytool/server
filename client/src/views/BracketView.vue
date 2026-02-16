<template>
  <div>
    <h1 class="title">Bracket</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else-if="!data" class="notification is-info">No bracket data available.</div>
    <div v-else class="is-flex" style="overflow-x: auto;">
      <div v-for="(round, idx) in data.rounds" :key="idx" class="bracket-round">
        <div class="has-text-centered has-text-weight-bold mb-2">Round {{ idx + 1 }}</div>
        <div v-for="match in round" :key="match.id" class="bracket-match">
          <div class="bracket-team" :class="{ winner: match.home_win }">
            {{ match.home_team }} {{ match.home_points !== null ? `(${match.home_points})` : '' }}
          </div>
          <div class="bracket-team" :class="{ winner: !match.home_win && match.home_points !== null }">
            {{ match.away_team ?? 'BYE' }} {{ match.away_points !== null ? `(${match.away_points})` : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSeasonStore } from '@/stores/season'

interface BracketMatch {
  id: number
  home_team: string
  away_team: string | null
  home_points: number | null
  away_points: number | null
  home_win: boolean | null
}

interface BracketData {
  rounds: BracketMatch[][]
}

const seasonStore = useSeasonStore()
const data = ref<BracketData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  await seasonStore.fetchActiveSeason()
  const season = seasonStore.activeSeason
  if (!season) {
    loading.value = false
    return
  }
  try {
    const res = await fetch(`/api/v1/seasons/${season.id}/bracket`)
    if (!res.ok) throw new Error('Failed to load bracket')
    data.value = await res.json() as BracketData
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
