<template>
  <div>
    <h1 class="title">Manage Admin Groups</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead><tr><th>Name</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="g in groups" :key="g.id">
            <td>{{ g.name }}</td>
            <td>
              <button class="button is-small is-danger" @click="deleteGroup(g.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="field has-addons">
        <div class="control">
          <input v-model="newName" class="input" type="text" placeholder="Group name" />
        </div>
        <div class="control">
          <button class="button is-primary" @click="addGroup">Add Group</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiPost, apiDelete } from '@/api/client'

interface AdminGroup { id: number; name: string }

const groups = ref<AdminGroup[]>([])
const newName = ref('')
const loading = ref(true)

onMounted(async () => { await load() })

async function load(): Promise<void> {
  loading.value = true
  const res = await fetch('/api/v1/admin-groups')
  if (res.ok) groups.value = await res.json() as AdminGroup[]
  loading.value = false
}

async function addGroup(): Promise<void> {
  if (!newName.value.trim()) return
  await apiPost('/api/v1/admin-groups', { name: newName.value })
  newName.value = ''
  await load()
}

async function deleteGroup(id: number): Promise<void> {
  if (!confirm('Delete this group?')) return
  await apiDelete(`/api/v1/admin-groups/${id}`)
  await load()
}
</script>
