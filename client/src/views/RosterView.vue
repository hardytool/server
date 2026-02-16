<template>
  <div>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else-if="team">
      <h1 class="title" :class="{ disbanded: team.disbanded }">{{ team.name }}</h1>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Player</th>
            <th>MMR</th>
            <th>Captain</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in roster" :key="p.player_id">
            <td>
              <RouterLink :to="`/profile/${p.steam_id}`">{{ p.name }}</RouterLink>
            </td>
            <td>{{ p.adjusted_mmr }}</td>
            <td>
              <span v-if="p.is_captain" class="tag is-warning">Captain</span>
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

interface RosterPlayer {
  player_id: number
  steam_id: string
  name: string
  adjusted_mmr: number
  is_captain: boolean
}

interface TeamDetail {
  id: number
  name: string
  disbanded: boolean
}

const route = useRoute()
const team = ref<TeamDetail | null>(null)
const roster = ref<RosterPlayer[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const { team_id } = route.params as { team_id: string }
  try {
    const [teamRes, rosterRes] = await Promise.all([
      fetch(`/api/v1/teams/${team_id}`),
      fetch(`/api/v1/teams/${team_id}/roster`),
    ])
    if (!teamRes.ok || !rosterRes.ok) throw new Error('Failed to load roster')
    team.value = await teamRes.json() as TeamDetail
    roster.value = await rosterRes.json() as RosterPlayer[]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
