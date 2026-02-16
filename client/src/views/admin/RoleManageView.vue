<template>
  <div>
    <h1 class="title">Manage Roles</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead><tr><th>Name</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="r in roles" :key="r.id">
            <td>{{ r.name }}</td>
            <td><button class="button is-small is-danger" @click="deleteRole(r.id)">Delete</button></td>
          </tr>
        </tbody>
      </table>
      <div class="field has-addons">
        <div class="control">
          <input v-model="newName" class="input" type="text" placeholder="Role name" />
        </div>
        <div class="control">
          <button class="button is-primary" @click="addRole">Add Role</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiPost, apiDelete } from '@/api/client'

interface Role { id: number; name: string }

const roles = ref<Role[]>([])
const newName = ref('')
const loading = ref(true)

onMounted(async () => { await load() })

async function load(): Promise<void> {
  loading.value = true
  const res = await fetch('/api/v1/roles')
  if (res.ok) roles.value = await res.json() as Role[]
  loading.value = false
}

async function addRole(): Promise<void> {
  if (!newName.value.trim()) return
  await apiPost('/api/v1/roles', { name: newName.value })
  newName.value = ''
  await load()
}

async function deleteRole(id: number): Promise<void> {
  if (!confirm('Delete this role?')) return
  await apiDelete(`/api/v1/roles/${id}`)
  await load()
}
</script>
