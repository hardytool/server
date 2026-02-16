<template>
  <div>
    <h1 class="title">Manage Admins</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead><tr><th>Name</th><th>Steam ID</th><th>Group</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="a in admins" :key="a.steam_id">
            <td>{{ a.name }}</td>
            <td>{{ a.steam_id }}</td>
            <td>{{ a.group_name }}</td>
            <td>
              <button class="button is-small is-danger" @click="deleteAdmin(a.steam_id)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="field has-addons">
        <div class="control">
          <input v-model="newSteamId" class="input" type="text" placeholder="Steam ID" />
        </div>
        <div class="control">
          <button class="button is-primary" @click="addAdmin">Add Admin</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiPost, apiDelete } from '@/api/client'

interface AdminRow { steam_id: string; name: string; group_name: string }

const admins = ref<AdminRow[]>([])
const newSteamId = ref('')
const loading = ref(true)

onMounted(async () => { await load() })

async function load(): Promise<void> {
  loading.value = true
  const res = await fetch('/api/v1/admins')
  if (res.ok) admins.value = await res.json() as AdminRow[]
  loading.value = false
}

async function addAdmin(): Promise<void> {
  if (!newSteamId.value.trim()) return
  await apiPost('/api/v1/admins', { steam_id: newSteamId.value })
  newSteamId.value = ''
  await load()
}

async function deleteAdmin(steamId: string): Promise<void> {
  if (!confirm('Remove this admin?')) return
  await apiDelete(`/api/v1/admins/${steamId}`)
  await load()
}
</script>
