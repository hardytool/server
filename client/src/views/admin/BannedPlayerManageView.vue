<template>
  <div>
    <h1 class="title">Banned Players</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Steam ID</th>
            <th>Reason</th>
            <th>Banned Until</th>
            <th>Still Banned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in banned" :key="b.id">
            <td>{{ b.name }}</td>
            <td>{{ b.steam_id }}</td>
            <td>{{ b.reason }}</td>
            <td>{{ b.banned_until ?? 'Permanent' }}</td>
            <td>{{ b.still_banned ? 'Yes' : 'No' }}</td>
            <td>
              <button class="button is-small is-danger" @click="deleteBan(b.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiDelete } from '@/api/client'

interface BannedPlayer {
  id: number; name: string; steam_id: string; reason: string
  banned_until: string | null; still_banned: boolean
}

const banned = ref<BannedPlayer[]>([])
const loading = ref(true)

onMounted(async () => {
  const res = await fetch('/api/v1/banned-players')
  if (res.ok) banned.value = await res.json() as BannedPlayer[]
  loading.value = false
})

async function deleteBan(id: number): Promise<void> {
  if (!confirm('Delete this ban?')) return
  await apiDelete(`/api/v1/banned-players/${id}`)
  banned.value = banned.value.filter(b => b.id !== id)
}
</script>
