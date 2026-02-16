<template>
  <div>
    <h1 class="title">Manage Playoff Series</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <table v-else class="table is-fullwidth is-striped is-hoverable">
      <thead>
        <tr>
          <th>Home</th>
          <th>Away</th>
          <th>Score</th>
          <th>Playoff</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in seriesList" :key="s.id">
          <td>{{ s.home_team_name }}</td>
          <td>{{ s.away_team_name ?? 'BYE' }}</td>
          <td>{{ s.home_points !== null ? `${s.home_points} - ${s.away_points}` : 'TBD' }}</td>
          <td>{{ s.is_playoff ? 'Yes' : 'No' }}</td>
          <td>
            <button class="button is-small is-danger" @click="deleteSeries(s.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiDelete } from '@/api/client'
import { useSeasonStore } from '@/stores/season'

interface SeriesRow {
  id: number; home_team_name: string; away_team_name: string | null
  home_points: number | null; away_points: number | null; is_playoff: boolean
}

const seasonStore = useSeasonStore()
const seriesList = ref<SeriesRow[]>([])
const loading = ref(true)

onMounted(async () => {
  await seasonStore.fetchActiveSeason()
  const season = seasonStore.activeSeason
  if (season) {
    const res = await fetch(`/api/v1/seasons/${season.id}/playoff-series`)
    if (res.ok) seriesList.value = await res.json() as SeriesRow[]
  }
  loading.value = false
})

async function deleteSeries(id: number): Promise<void> {
  if (!confirm('Delete this series?')) return
  await apiDelete(`/api/v1/playoff-series/${id}`)
  const season = seasonStore.activeSeason
  if (season) {
    const res = await fetch(`/api/v1/seasons/${season.id}/playoff-series`)
    if (res.ok) seriesList.value = await res.json() as SeriesRow[]
  }
}
</script>
