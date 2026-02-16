<template>
  <div>
    <AppNavbar />
    <main class="section">
      <div class="container">
        <RouterView />
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import { useSeasonStore } from '@/stores/season'

const auth = useAuthStore()
const seasonStore = useSeasonStore()

onMounted(async () => {
  await auth.fetchMe()
  await seasonStore.fetchActiveSeason()
})

// Apply bulmaswatch theme dynamically based on user preference
watchEffect(() => {
  const link = document.getElementById('bulmaswatch') as HTMLLinkElement | null
  if (!link) return
  const theme = auth.user?.theme
  if (theme && theme !== 'default') {
    link.href = `https://cdn.jsdelivr.net/npm/bulmaswatch@0.8.1/css/${theme}/bulmaswatch.min.css`
  } else {
    link.href = ''
  }
})
</script>
