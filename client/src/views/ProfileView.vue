<template>
  <div>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else-if="profile">
      <div class="columns">
        <div class="column is-narrow">
          <figure class="image is-128x128">
            <img :src="profile.avatar" :alt="profile.name" />
          </figure>
        </div>
        <div class="column">
          <h1 class="title">{{ profile.name }}</h1>
          <p v-if="profile.faceit_name">
            <strong>Faceit:</strong> {{ profile.faceit_name }}
          </p>
          <p v-if="profile.discord_name">
            <strong>Discord:</strong> {{ profile.discord_name }}
          </p>
          <p><strong>MMR:</strong> {{ profile.draft_mmr }}</p>
          <p v-if="auth.user?.steamId === profile.steam_id || auth.user?.isAdmin">
            <RouterLink :to="`/profile/${profile.steam_id}/edit`" class="button is-small is-info">
              Edit Profile
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface ProfileData {
  steam_id: string
  name: string
  avatar: string
  faceit_name: string | null
  discord_name: string | null
  draft_mmr: number
  theme: string
  is_admin: boolean
}

const route = useRoute()
const auth = useAuthStore()
const profile = ref<ProfileData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const { steam_id } = route.params as { steam_id: string }
  try {
    const res = await fetch(`/api/v1/profiles/${steam_id}`)
    if (!res.ok) throw new Error('Profile not found')
    profile.value = await res.json() as ProfileData
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>
