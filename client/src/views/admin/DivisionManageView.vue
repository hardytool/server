<template>
  <div>
    <h1 class="title">Manage Divisions</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Active</th>
            <th>Start Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in divisions" :key="d.id">
            <td>{{ d.name }}</td>
            <td>{{ d.active ? 'Yes' : 'No' }}</td>
            <td>{{ d.start_time }}</td>
            <td>
              <button class="button is-small is-info mr-1" @click="editDivision(d)">Edit</button>
              <button class="button is-small is-danger" @click="deleteDivision(d.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button class="button is-primary" @click="newDivision">New Division</button>

      <div v-if="editing" class="modal is-active">
        <div class="modal-background" @click="editing = null"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">{{ editing.id ? 'Edit Division' : 'New Division' }}</p>
            <button class="delete" @click="editing = null"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Name</label>
              <input v-model="editing.name" class="input" type="text" />
            </div>
            <div class="field">
              <label class="checkbox">
                <input v-model="editing.active" type="checkbox" /> Active
              </label>
            </div>
            <div class="field">
              <label class="label">Discord URL</label>
              <input v-model="editing.discord_url" class="input" type="text" />
            </div>
            <div class="field">
              <label class="label">Start Time</label>
              <input v-model="editing.start_time" class="input" type="text" />
            </div>
            <div class="field">
              <label class="label">Draft Sheet URL</label>
              <input v-model="editing.draft_sheet_url" class="input" type="text" />
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-primary" :class="{ 'is-loading': saving }" @click="saveDivision">Save</button>
            <button class="button" @click="editing = null">Cancel</button>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiPost, apiDelete } from '@/api/client'

interface Division {
  id: number
  name: string
  active: boolean
  discord_url: string
  start_time: string
  draft_sheet_url: string
}

const divisions = ref<Division[]>([])
const loading = ref(true)
const saving = ref(false)
const editing = ref<Partial<Division> | null>(null)

onMounted(async () => { await load() })

async function load(): Promise<void> {
  loading.value = true
  const res = await fetch('/api/v1/divisions/all')
  if (res.ok) divisions.value = await res.json() as Division[]
  loading.value = false
}

function editDivision(d: Division): void { editing.value = { ...d } }
function newDivision(): void {
  editing.value = { name: '', active: false, discord_url: '', start_time: '', draft_sheet_url: '' }
}

async function saveDivision(): Promise<void> {
  saving.value = true
  await apiPost('/api/v1/divisions', editing.value)
  editing.value = null
  saving.value = false
  await load()
}

async function deleteDivision(id: number): Promise<void> {
  if (!confirm('Delete this division?')) return
  await apiDelete(`/api/v1/divisions/${id}`)
  await load()
}
</script>
