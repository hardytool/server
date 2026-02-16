<template>
  <div>
    <h1 class="title">Manage Teams</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Season</th>
            <th>Division</th>
            <th>Disbanded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in teams" :key="t.id">
            <td :class="{ disbanded: t.disbanded }">
              <RouterLink :to="`/teams/${t.id}`">{{ t.name }}</RouterLink>
            </td>
            <td>{{ t.season_id }}</td>
            <td>{{ t.division_id }}</td>
            <td>{{ t.disbanded ? 'Yes' : 'No' }}</td>
            <td>
              <RouterLink :to="`/admin/teams/${t.id}/roster`" class="button is-small is-info mr-1">Roster</RouterLink>
              <button class="button is-small is-danger" @click="deleteTeam(t.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { apiDelete } from '@/api/client'

interface TeamRow {
  id: number; name: string; season_id: number; division_id: number; disbanded: boolean
}

const teams = ref<TeamRow[]>([])
const loading = ref(true)

onMounted(async () => { await load() })

async function load(): Promise<void> {
  loading.value = true
  const res = await fetch('/teams/json')
  if (res.ok) teams.value = await res.json() as TeamRow[]
  loading.value = false
}

async function deleteTeam(id: number): Promise<void> {
  if (!confirm('Delete this team?')) return
  await apiDelete(`/api/v1/teams/${id}`)
  await load()
}
</script>
