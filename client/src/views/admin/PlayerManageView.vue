<template>
  <div>
    <h1 class="title">Manage Players</h1>
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
            <select v-model="selectedDivision" @change="loadPlayers">
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
          <th>Name</th>
          <th>MMR</th>
          <th>Captain</th>
          <th>Approved</th>
          <th>Draftable</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in players" :key="p.id">
          <td>
            <RouterLink :to="`/profile/${p.steam_id}`">{{ p.name }}</RouterLink>
          </td>
          <td>{{ p.adjusted_mmr }}</td>
          <td>{{ p.will_captain }}</td>
          <td>{{ p.captain_approved ? 'Yes' : 'No' }}</td>
          <td>{{ p.is_draftable ? 'Yes' : 'No' }}</td>
          <td>
            <button class="button is-small is-danger" @click="removePlayer(p.id)">Remove</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { apiDelete } from '@/api/client'
import type { Season } from '@/stores/season'

interface Division { id: number; name: string }
interface PlayerRow {
  id: number; steam_id: string; name: string; adjusted_mmr: number
  will_captain: string; captain_approved: boolean; is_draftable: boolean
}

const seasons = ref<Season[]>([])
const divisions = ref<Division[]>([])
const players = ref<PlayerRow[]>([])
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
  if (!selectedSeason.value) return
  const res = await fetch('/api/v1/divisions/all')
  if (res.ok) divisions.value = await res.json() as Division[]
  if (divisions.value.length) {
    selectedDivision.value = divisions.value[0].id
    await loadPlayers()
  }
}

async function loadPlayers(): Promise<void> {
  if (!selectedSeason.value || !selectedDivision.value) return
  loading.value = true
  const res = await fetch(`/api/v1/seasons/${selectedSeason.value}/divisions/${selectedDivision.value}/players`)
  if (res.ok) players.value = await res.json() as PlayerRow[]
  loading.value = false
}

async function removePlayer(id: number): Promise<void> {
  if (!confirm('Remove this player?')) return
  await apiDelete(`/api/v1/players/${id}`)
  await loadPlayers()
}
</script>
