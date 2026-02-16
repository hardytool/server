<template>
  <section class="section">
    <div class="container">
      <h1 class="title">Active Divisions</h1>

      <div v-if="loading" class="has-text-centered py-6">
        <span class="icon is-large"><i class="fas fa-spinner fa-spin fa-2x"></i></span>
      </div>

      <div v-else-if="error" class="notification is-danger">
        {{ error }}
      </div>

      <div v-else class="columns is-multiline">
        <div
          v-for="division in divisions"
          :key="division.id"
          class="column is-one-third"
        >
          <div class="card">
            <div class="card-content">
              <p class="title is-5">{{ division.name }}</p>
              <p v-if="division.discord_url" class="content is-size-7">
                <a :href="division.discord_url" target="_blank" rel="noopener">
                  <span class="icon"><i class="fab fa-discord"></i></span>
                  Discord
                </a>
              </p>
            </div>
            <footer class="card-footer">
              <RouterLink
                class="card-footer-item"
                :to="`/divisions/${division.id}`"
              >View division</RouterLink>
            </footer>
          </div>
        </div>

        <div v-if="divisions.length === 0" class="column">
          <p class="has-text-grey">No active divisions.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type Division } from '../api'

const divisions = ref<Division[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    divisions.value = await api.divisions.list()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load divisions'
  } finally {
    loading.value = false
  }
})
</script>
