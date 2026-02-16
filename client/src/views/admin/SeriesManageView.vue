<template>
  <div>
    <h1 class="title">Manage Series</h1>
    <p class="subtitle">Use the season and division selectors to view and manage series results.</p>
    <div class="columns">
      <div class="column is-narrow">
        <div class="field">
          <label class="label">Season</label>
          <div class="select">
            <select v-model="selectedSeason" @change="loadDivisions">
              <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>
      </div>
      <div class="column is-narrow">
        <div class="field">
          <label class="label">Division</label>
          <div class="select">
            <select v-model="selectedDivision" @change="loadSeries">
              <option v-for="d in divisions" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <table v-else class="table is-fullwidth is-striped is-hoverable">
      <thead>
        <tr>
          <th>Round</th>
          <th>Home</th>
          <th>Away</th>
          <th>Score</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in seriesList" :key="s.id">
          <td>{{ s.round }}</td>
          <td>{{ s.home_team_name }}</td>
          <td>{{ s.away_team_name ?? 'BYE' }}</td>
          <td>{{ s.home_points !== null ? `${s.home_points} - ${s.away_points}` : 'TBD' }}</td>
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
import type { Season } from '@/stores/season'

interface Division { id: number; name: string }
interface SeriesRow {
  id: number; round: number; home_team_name: string; away_team_name: string | null
  home_points: number | null; away_points: number | null
}

const seasons = ref<Season[]>([])
const divisions = ref<Division[]>([])
const seriesList = ref<SeriesRow[]>([])
const selectedSeason = ref<number | null>(null)
const selectedDivision = ref<number | null>(null)
const loading = ref(false)

onMounted(async () => {
  const res = await fetch('/api/v1/seasons')
  if (res.ok) seasons.value = await res.json() as Season[]
  if (seasons.value.length) {
    selectedSeason.value = seasons.value.find(s => s.active)?.id ?? seasons.value[0].id
    await loadDivisions()
  }
})

async function loadDivisions(): Promise<void> {
  const res = await fetch('/api/v1/divisions/all')
  if (res.ok) divisions.value = await res.json() as Division[]
  if (divisions.value.length) {
    selectedDivision.value = divisions.value[0].id
    await loadSeries()
  }
}

async function loadSeries(): Promise<void> {
  if (!selectedSeason.value || !selectedDivision.value) return
  loading.value = true
  const res = await fetch(`/api/v1/seasons/${selectedSeason.value}/divisions/${selectedDivision.value}/series`)
  if (res.ok) seriesList.value = await res.json() as SeriesRow[]
  loading.value = false
}

async function deleteSeries(id: number): Promise<void> {
  if (!confirm('Delete this series?')) return
  await apiDelete(`/api/v1/series/${id}`)
  await loadSeries()
}
</script>
