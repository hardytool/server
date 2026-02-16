<template>
  <div>
    <h1 class="title">Inhouse Rules</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="html" class="content" v-html="html"></div>
    <div v-else class="notification is-warning">Inhouse rules not available.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const html = ref<string>('')
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/api/v1/inhouserules')
    if (res.ok) {
      const data = await res.json() as { html: string }
      html.value = data.html
    }
  } finally {
    loading.value = false
  }
})
</script>
