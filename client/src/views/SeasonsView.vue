<template>
  <section class="section">
    <div class="container">
      <h1 class="title">Seasons</h1>

      <div v-if="loading" class="has-text-centered py-6">
        <span class="icon is-large"><i class="fas fa-spinner fa-spin fa-2x"></i></span>
      </div>

      <div v-else-if="error" class="notification is-danger">
        {{ error }}
      </div>

      <div v-else>
        <table class="table is-fullwidth is-hoverable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="season in seasons" :key="season.id">
              <td>{{ season.id }}</td>
              <td>{{ season.name }}</td>
            </tr>
            <tr v-if="seasons.length === 0">
              <td colspan="2" class="has-text-centered has-text-grey">No seasons found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type Season } from '../api'

const seasons = ref<Season[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    seasons.value = await api.seasons.list()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load seasons'
  } finally {
    loading.value = false
  }
})
</script>
