<template>
  <div>
    <h1 class="title">Seasons</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Status</th>
            <th>Registration</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in seasons" :key="s.id">
            <td>{{ s.number }}</td>
            <td>{{ s.name }}</td>
            <td>
              <span v-if="s.active" class="tag is-success">Active</span>
              <span v-else class="tag">Inactive</span>
            </td>
            <td>
              <span v-if="s.registration_open" class="tag is-info">Open</span>
              <span v-else class="tag">Closed</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Season } from '@/stores/season'

const seasons = ref<Season[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/v1/seasons')
    if (!res.ok) throw new Error('Failed to load seasons')
    seasons.value = await res.json() as Season[]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
