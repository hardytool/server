<template>
  <div>
    <h1 class="title">Edit Profile</h1>
    <div v-if="loading" class="has-text-centered"><span class="loader"></span></div>
    <div v-else-if="error" class="notification is-danger">{{ error }}</div>
    <form v-else-if="form" @submit.prevent="save">
      <div class="field">
        <label class="label">Display Name</label>
        <div class="control">
          <input
            v-model="form.name"
            class="input"
            type="text"
            :disabled="form.name_locked && !auth.user?.isAdmin"
          />
        </div>
      </div>
      <div class="field">
        <label class="label">Faceit Name</label>
        <div class="control">
          <input v-model="form.faceit_name" class="input" type="text" />
        </div>
      </div>
      <div class="field">
        <label class="label">Discord Name</label>
        <div class="control">
          <input v-model="form.discord_name" class="input" type="text" />
        </div>
      </div>
      <div class="field">
        <label class="label">Theme</label>
        <div class="control">
          <div class="select">
            <select v-model="form.theme">
              <option value="default">Default</option>
              <option value="darkly">Darkly</option>
              <option value="flatly">Flatly</option>
              <option value="cerulean">Cerulean</option>
              <option value="cosmo">Cosmo</option>
              <option value="cyborg">Cyborg</option>
              <option value="journal">Journal</option>
              <option value="litera">Litera</option>
              <option value="lumen">Lumen</option>
              <option value="lux">Lux</option>
              <option value="materia">Materia</option>
              <option value="minty">Minty</option>
              <option value="nuclear">Nuclear</option>
              <option value="pulse">Pulse</option>
              <option value="sandstone">Sandstone</option>
              <option value="simplex">Simplex</option>
              <option value="slate">Slate</option>
              <option value="solar">Solar</option>
              <option value="spacelab">Spacelab</option>
              <option value="superhero">Superhero</option>
              <option value="united">United</option>
              <option value="yeti">Yeti</option>
            </select>
          </div>
        </div>
      </div>
      <div v-if="saveError" class="notification is-danger">{{ saveError }}</div>
      <div class="field">
        <div class="control">
          <button type="submit" class="button is-primary" :class="{ 'is-loading': saving }">
            Save
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiPut } from '@/api/client'

interface ProfileForm {
  name: string | null
  name_locked: boolean
  faceit_name: string | null
  discord_name: string | null
  theme: string
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const form = ref<ProfileForm | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)

onMounted(async () => {
  const { steam_id } = route.params as { steam_id: string }
  try {
    const res = await fetch(`/api/v1/profiles/${steam_id}`)
    if (!res.ok) throw new Error('Profile not found')
    const data = await res.json() as ProfileForm
    form.value = {
      name: data.name,
      name_locked: data.name_locked,
      faceit_name: data.faceit_name,
      discord_name: data.discord_name,
      theme: data.theme,
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})

async function save(): Promise<void> {
  if (!form.value) return
  const { steam_id } = route.params as { steam_id: string }
  saving.value = true
  saveError.value = null
  try {
    const res = await apiPut(`/api/v1/profiles/${steam_id}`, form.value)
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || 'Failed to save')
    }
    await router.push(`/profile/${steam_id}`)
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    saving.value = false
  }
}
</script>
