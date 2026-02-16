<template>
  <div>
    <h1 class="title">Registration</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <div v-else-if="!seasonStore.activeSeason" class="notification is-info">
      There is no active season.
    </div>
    <div v-else-if="!seasonStore.activeSeason.registration_open" class="notification is-warning">
      Registration is not currently open.
    </div>
    <form v-else @submit.prevent="save">
      <div class="field">
        <label class="label">Will you captain?</label>
        <div class="control">
          <div class="select">
            <select v-model="form.will_captain">
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="label">Statement (optional, max 500 chars)</label>
        <div class="control">
          <textarea v-model="form.statement" class="textarea" maxlength="500"></textarea>
        </div>
      </div>
      <div v-if="saveError" class="notification is-danger">{{ saveError }}</div>
      <div class="field is-grouped">
        <div class="control">
          <button type="submit" class="button is-primary" :class="{ 'is-loading': saving }">
            {{ existing ? 'Update Registration' : 'Register' }}
          </button>
        </div>
        <div v-if="existing" class="control">
          <button type="button" class="button is-danger" @click="unregister">Unregister</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeasonStore } from '@/stores/season'
import { apiPost, apiDelete } from '@/api/client'

interface RegistrationForm {
  will_captain: 'yes' | 'maybe' | 'no'
  statement: string
}

const route = useRoute()
const router = useRouter()
const seasonStore = useSeasonStore()

const form = ref<RegistrationForm>({ will_captain: 'no', statement: '' })
const existing = ref(false)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)

onMounted(async () => {
  await seasonStore.fetchActiveSeason()
  const season = seasonStore.activeSeason
  if (!season) { loading.value = false; return }

  const { season_id, division_id } = route.params as { season_id?: string; division_id?: string }
  const sid = season_id ?? String(season.id)
  const did = division_id ?? ''

  if (!did) { loading.value = false; return }

  try {
    const res = await fetch(`/api/v1/seasons/${sid}/divisions/${did}/registration`)
    if (res.ok) {
      const data = await res.json() as RegistrationForm & { registered: boolean }
      if (data.registered) {
        existing.value = true
        form.value = { will_captain: data.will_captain, statement: data.statement }
      }
    }
  } catch (_err) {
    // not registered yet is fine
  } finally {
    loading.value = false
  }
})

async function save(): Promise<void> {
  saving.value = true
  saveError.value = null
  try {
    const res = await apiPost('/api/v1/register', form.value)
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || 'Failed to register')
    }
    await router.push('/')
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    saving.value = false
  }
}

async function unregister(): Promise<void> {
  if (!confirm('Are you sure you want to unregister?')) return
  try {
    const res = await apiDelete('/api/v1/register')
    if (!res.ok) throw new Error('Failed to unregister')
    await router.push('/')
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Unknown error'
  }
}
</script>
