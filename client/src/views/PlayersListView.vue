<template>
  <div>
    <h1 class="title">Players</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>MMR</th>
            <th>Rank</th>
            <th>Captain</th>
            <th>Vouched</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in players" :key="p.id">
            <td>
              <RouterLink :to="`/profile/${p.steam_id}`">{{ p.name }}</RouterLink>
            </td>
            <td>{{ p.adjusted_mmr }}</td>
            <td>{{ p.rank }}</td>
            <td>{{ p.will_captain }}</td>
            <td>
              <span v-if="p.is_vouched" class="tag is-success">Yes</span>
              <span v-else class="tag">No</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

interface PlayerRow {
  id: number
  steam_id: string
  name: string
  adjusted_mmr: number
  rank: number
  will_captain: string
  is_vouched: boolean
}

const route = useRoute()
const players = ref<PlayerRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const { season_id, division_id } = route.params as { season_id: string; division_id: string }
  try {
    const res = await fetch(`/api/v1/seasons/${season_id}/divisions/${division_id}/players`)
    if (!res.ok) throw new Error('Failed to load players')
    players.value = await res.json() as PlayerRow[]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
