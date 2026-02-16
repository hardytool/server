<template>
  <div>
    <h1 class="title">Manage Seasons</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else>
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Active</th>
            <th>Reg. Open</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in seasons" :key="s.id">
            <td>{{ s.number }}</td>
            <td>{{ s.name }}</td>
            <td>{{ s.active ? 'Yes' : 'No' }}</td>
            <td>{{ s.registration_open ? 'Yes' : 'No' }}</td>
            <td>
              <button class="button is-small is-info mr-1" @click="editSeason(s)">Edit</button>
              <button class="button is-small is-danger" @click="deleteSeason(s.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button class="button is-primary" @click="newSeason">New Season</button>

      <div v-if="editing" class="modal is-active">
        <div class="modal-background" @click="editing = null"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">{{ editing.id ? 'Edit Season' : 'New Season' }}</p>
            <button class="delete" @click="editing = null"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Number</label>
              <input v-model.number="editing.number" class="input" type="number" />
            </div>
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
              <label class="checkbox">
                <input v-model="editing.registration_open" type="checkbox" /> Registration Open
              </label>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-primary" :class="{ 'is-loading': saving }" @click="saveSeason">Save</button>
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
import type { Season } from '@/stores/season'

const seasons = ref<Season[]>([])
const loading = ref(true)
const saving = ref(false)
const editing = ref<Partial<Season> | null>(null)

onMounted(async () => {
  await load()
})

async function load(): Promise<void> {
  loading.value = true
  const res = await fetch('/api/v1/seasons')
  if (res.ok) seasons.value = await res.json() as Season[]
  loading.value = false
}

function editSeason(s: Season): void {
  editing.value = { ...s }
}

function newSeason(): void {
  editing.value = { number: 0, name: '', active: false, activity_check: false, registration_open: false }
}

async function saveSeason(): Promise<void> {
  saving.value = true
  await apiPost('/api/v1/seasons', editing.value)
  editing.value = null
  saving.value = false
  await load()
}

async function deleteSeason(id: number): Promise<void> {
  if (!confirm('Delete this season?')) return
  await apiDelete(`/api/v1/seasons/${id}`)
  await load()
}
</script>
