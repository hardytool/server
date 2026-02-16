<template>
  <div>
    <h1 class="title">IP Addresses</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <div class="field has-addons mb-4">
        <div class="control is-expanded">
          <input v-model="search" class="input" type="text" placeholder="Filter by IP or Steam ID..." />
        </div>
      </div>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead><tr><th>IP</th><th>Steam ID</th><th>Name</th></tr></thead>
        <tbody>
          <tr v-for="ip in filtered" :key="`${ip.ip}-${ip.steam_id}`">
            <td>{{ ip.ip }}</td>
            <td>{{ ip.steam_id }}</td>
            <td>
              <RouterLink :to="`/profile/${ip.steam_id}`">{{ ip.name }}</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

interface IpRow { ip: string; steam_id: string; name: string }

const ips = ref<IpRow[]>([])
const search = ref('')
const loading = ref(true)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return ips.value
  return ips.value.filter(r => r.ip.includes(q) || r.steam_id.includes(q) || r.name.toLowerCase().includes(q))
})

onMounted(async () => {
  const res = await fetch('/api/v1/ips')
  if (res.ok) ips.value = await res.json() as IpRow[]
  loading.value = false
})
</script>
