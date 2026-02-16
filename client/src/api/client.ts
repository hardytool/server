import { useAuthStore } from '@/stores/auth'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

async function request(method: HttpMethod, url: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (method !== 'GET') {
    const auth = useAuthStore()
    headers['X-CSRF-Token'] = auth.csrfToken
  }

  return fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function apiGet(url: string): Promise<Response> {
  return request('GET', url)
}

export async function apiPost(url: string, body?: unknown): Promise<Response> {
  return request('POST', url, body)
}

export async function apiPut(url: string, body?: unknown): Promise<Response> {
  return request('PUT', url, body)
}

export async function apiDelete(url: string): Promise<Response> {
  return request('DELETE', url)
}
