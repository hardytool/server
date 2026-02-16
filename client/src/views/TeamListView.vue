<template>
  <div>
    <h1 class="title">Teams</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else>
      <div class="columns is-multiline">
        <div v-for="t in teams" :key="t.id" class="column is-4">
          <div class="card" :class="{ 'has-background-light': t.disbanded }">
            <div class="card-content">
              <p class="title is-5" :class="{ disbanded: t.disbanded }">
                <RouterLink :to="`/teams/${t.id}`">{{ t.name }}</RouterLink>
              </p>
              <p v-if="t.captain_name" class="subtitle is-6">
                Captain: {{ t.captain_name }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

interface TeamRow {
  id: number
  name: string
  disbanded: boolean
  captain_name: string | null
}

const route = useRoute()
const teams = ref<TeamRow[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const { season_id, division_id } = route.params as { season_id: string; division_id: string }
  try {
    const res = await fetch(`/api/v1/seasons/${season_id}/divisions/${division_id}/teams`)
    if (!res.ok) throw new Error('Failed to load teams')
    teams.value = await res.json() as TeamRow[]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
