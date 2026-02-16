<template>
  <div>
    <h1 class="title">Roster Management</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <h2 class="subtitle">Current Roster</h2>
      <table class="table is-fullwidth is-striped">
        <thead><tr><th>Name</th><th>Captain</th><th></th></tr></thead>
        <tbody>
          <tr v-for="p in roster" :key="p.player_id">
            <td>{{ p.name }}</td>
            <td>{{ p.is_captain ? 'Yes' : '' }}</td>
            <td>
              <button class="button is-small is-danger" @click="remove(p.player_id)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 class="subtitle">Add Player</h2>
      <div class="select">
        <select v-model="selected">
          <option v-for="p in unassigned" :key="p.id" :value="p.id">{{ p.name }} ({{ p.adjusted_mmr }})</option>
        </select>
      </div>
      <button class="button is-primary ml-2" @click="add">Add</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiPost, apiDelete } from '@/api/client'

interface RosterPlayer { player_id: number; name: string; is_captain: boolean }
interface UnassignedPlayer { id: number; name: string; adjusted_mmr: number }

const route = useRoute()
const roster = ref<RosterPlayer[]>([])
const unassigned = ref<UnassignedPlayer[]>([])
const selected = ref<number | null>(null)
const loading = ref(true)

onMounted(async () => { await load() })

async function load(): Promise<void> {
  loading.value = true
  const { team_id } = route.params as { team_id: string }
  const [rRes] = await Promise.all([
    fetch(`/api/v1/teams/${team_id}/roster`),
  ])
  if (rRes.ok) roster.value = await rRes.json() as RosterPlayer[]
  loading.value = false
}

async function add(): Promise<void> {
  if (!selected.value) return
  const { team_id } = route.params as { team_id: string }
  await apiPost(`/api/v1/teams/${team_id}/roster`, { player_id: selected.value })
  await load()
}

async function remove(playerId: number): Promise<void> {
  const { team_id } = route.params as { team_id: string }
  await apiDelete(`/api/v1/teams/${team_id}/roster/${playerId}`)
  await load()
}
</script>
