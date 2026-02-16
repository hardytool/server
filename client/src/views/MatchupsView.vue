<template>
  <div>
    <h1 class="title">Matchups</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Match</th>
            <th>Home</th>
            <th>Away</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in matchups" :key="m.match_number">
            <td>{{ m.match_number }}</td>
            <td>{{ m.home_team_name }}</td>
            <td>{{ m.away_team_name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface MatchupRow {
  match_number: number
  home_team_name: string
  away_team_name: string | null
}

const route = useRoute()
const matchups = ref<MatchupRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const { season_id, division_id, round } = route.params as { season_id: string; division_id: string; round?: string }
  const url = round
    ? `/api/v1/seasons/${season_id}/divisions/${division_id}/matchups/${round}`
    : `/api/v1/seasons/${season_id}/divisions/${division_id}/matchups`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to load matchups')
    matchups.value = await res.json() as MatchupRow[]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
