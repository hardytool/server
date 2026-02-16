<template>
  <div>
    <h1 class="title">Stand-ins</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>MMR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in standins" :key="p.id">
            <td>
              <RouterLink :to="`/profile/${p.steam_id}`">{{ p.name }}</RouterLink>
            </td>
            <td>{{ p.adjusted_mmr }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

interface StandinRow {
  id: number
  steam_id: string
  name: string
  adjusted_mmr: number
}

const route = useRoute()
const standins = ref<StandinRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const { season_id, division_id } = route.params as { season_id: string; division_id: string }
  try {
    const res = await fetch(`/api/v1/seasons/${season_id}/divisions/${division_id}/standins`)
    if (!res.ok) throw new Error('Failed to load stand-ins')
    standins.value = await res.json() as StandinRow[]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
