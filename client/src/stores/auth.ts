import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AuthUser {
  steamId: string
  displayName: string
  avatar: string
  isAdmin: boolean
  theme: string
  activityCheckRequired: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const csrfToken = ref<string>('')
  const initialized = ref(false)

  async function fetchMe(): Promise<void> {
    try {
      const [meRes, csrfRes] = await Promise.all([
        fetch('/api/v1/me'),
        fetch('/api/v1/csrf-token'),
      ])
      user.value = meRes.ok ? await meRes.json() as AuthUser : null
      const csrfData = await csrfRes.json() as { token: string }
      csrfToken.value = csrfData.token
    } catch (_err) {
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  function clearUser(): void {
    user.value = null
    initialized.value = false
  }

  return { user, csrfToken, initialized, fetchMe, clearUser }
})
