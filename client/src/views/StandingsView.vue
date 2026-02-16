<template>
  <div>
    <h1 class="title">Standings</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>W</th>
            <th>L</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in standings" :key="row.team_id">
            <td>{{ idx + 1 }}</td>
            <td>
              <RouterLink :to="`/teams/${row.team_id}`">{{ row.team_name }}</RouterLink>
            </td>
            <td>{{ row.wins }}</td>
            <td>{{ row.losses }}</td>
            <td>{{ row.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

interface StandingRow {
  team_id: number
  team_name: string
  wins: number
  losses: number
  points: number
}

const route = useRoute()
const standings = ref<StandingRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const { season_id, division_id, round } = route.params as { season_id: string; division_id: string; round?: string }
  const url = round
    ? `/api/v1/seasons/${season_id}/divisions/${division_id}/standings/${round}`
    : `/api/v1/seasons/${season_id}/divisions/${division_id}/standings`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to load standings')
    standings.value = await res.json() as StandingRow[]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
