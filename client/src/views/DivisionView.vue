<template>
  <section class="section">
    <div class="container">
      <div v-if="loading" class="has-text-centered py-6">
        <span class="icon is-large"><i class="fas fa-spinner fa-spin fa-2x"></i></span>
      </div>

      <div v-else-if="error" class="notification is-danger">
        {{ error }}
      </div>

      <template v-else-if="division">
        <h1 class="title">{{ division.name }}</h1>

        <div class="columns">
          <div class="column is-half">
            <div class="box">
              <h2 class="subtitle">Administrators</h2>
              <ul v-if="division.admins.length > 0">
                <li v-for="admin in division.admins" :key="admin.steam_id">
                  <a :href="`/profile/${admin.steam_id}`">{{ admin.name }}</a>
                </li>
              </ul>
              <p v-else class="has-text-grey">No admins listed.</p>
            </div>
          </div>

          <div class="column is-half">
            <div class="box">
              <h2 class="subtitle">Links</h2>
              <p v-if="division.discord_url">
                <a :href="division.discord_url" target="_blank" rel="noopener">
                  <span class="icon"><i class="fab fa-discord"></i></span>
                  Discord server
                </a>
              </p>
              <p v-else class="has-text-grey">No Discord link available.</p>
            </div>
          </div>
        </div>

        <div class="buttons">
          <RouterLink class="button is-light" to="/divisions">
            <span class="icon"><i class="fas fa-arrow-left"></i></span>
            <span>Back to divisions</span>
          </RouterLink>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api, type DivisionDetail } from '../api'

const route = useRoute()
const division = ref<DivisionDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const id = Number(route.params['divisionId'])
  try {
    division.value = await api.divisions.get(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load division'
  } finally {
    loading.value = false
  }
})
</script>
