<template>
  <div>
    <h1 class="title">Welcome to RD2L</h1>
    <div v-if="seasonStore.activeSeason" class="notification is-info">
      <strong>Active Season:</strong> {{ seasonStore.activeSeason.name }}
      <span v-if="seasonStore.activeSeason.registration_open">
        &mdash; <RouterLink to="/register">Registration is open!</RouterLink>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useSeasonStore } from '@/stores/season'

const seasonStore = useSeasonStore()
</script>
