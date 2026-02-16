<template>
  <section class="section">
    <div class="container">
      <h1 class="title">Players</h1>
      <p class="subtitle">Season {{ seasonId }} / Division {{ divisionId }}</p>

      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': tab === 'all' }">
            <a @click="tab = 'all'">All players</a>
          </li>
          <li :class="{ 'is-active': tab === 'captains' }">
            <a @click="tab = 'captains'">Captains</a>
          </li>
        </ul>
      </div>

      <div v-if="loading" class="has-text-centered py-6">
        <span class="icon is-large"><i class="fas fa-spinner fa-spin fa-2x"></i></span>
      </div>

      <div v-else-if="error" class="notification is-danger">
        {{ error }}
      </div>

      <table v-else-if="tab === 'all'" class="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>MMR</th>
            <th>Adjusted MMR</th>
            <th>Captain</th>
            <th>Standin</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in players" :key="p.id">
            <td>
              <a :href="`/profile/${p.steam_id}`">{{ p.name }}</a>
            </td>
            <td>{{ p.mmr }}</td>
            <td>{{ p.adjusted_mmr }}</td>
            <td>
              <span v-if="p.is_captain" class="tag is-success">Yes</span>
            </td>
            <td>
              <span v-if="p.is_standin" class="tag is-info">Yes</span>
            </td>
          </tr>
          <tr v-if="players.length === 0">
            <td colspan="5" class="has-text-centered has-text-grey">No players found.</td>
          </tr>
        </tbody>
      </table>

      <table v-else class="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>MMR</th>
            <th>Adjusted MMR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in captains" :key="c.steam_id">
            <td>
              <a :href="`/profile/${c.steam_id}`">{{ c.name }}</a>
            </td>
            <td>{{ c.mmr }}</td>
            <td>{{ c.adjusted_mmr }}</td>
          </tr>
          <tr v-if="captains.length === 0">
            <td colspan="3" class="has-text-centered has-text-grey">No captains found.</td>
          </tr>
        </tbody>
      </table>

      <div class="buttons mt-4">
        <RouterLink class="button is-light" to="/divisions">
          <span class="icon"><i class="fas fa-arrow-left"></i></span>
          <span>Back to divisions</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api, type Player, type Captain } from '../api'

const route = useRoute()
const seasonId = Number(route.params['seasonId'])
const divisionId = Number(route.params['divisionId'])

const tab = ref<'all' | 'captains'>('all')
const players = ref<Player[]>([])
const captains = ref<Captain[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const [p, c] = await Promise.all([
      api.divisions.players(seasonId, divisionId),
      api.divisions.captains(seasonId, divisionId),
    ])
    players.value = p
    captains.value = c
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load players'
  } finally {
    loading.value = false
  }
})
</script>
