import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Config } from '../../src/types/config'

describe('config', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    // Clear all env vars that config reads
    process.env = { ...originalEnv }
    delete process.env.STEAM_API_KEY
    delete process.env.SECRET
    delete process.env.HOST
    delete process.env.PORT
    delete process.env.HTTPS_PORT
    delete process.env.WEBSITE_URL
    delete process.env.POSTGRES_USER
    delete process.env.PGUSER
    delete process.env.POSTGRES_PASSWORD
    delete process.env.PGPASSWORD
    delete process.env.POSTGRES_DB
    delete process.env.PGDATABASE
    delete process.env.POSTGRES_HOST
    delete process.env.POSTGRES_PORT
    delete process.env.POSTGRES_SSL
    delete process.env.POSTGRES_POOL_MAX
    delete process.env.POSTGRES_TIMEOUT
  })

  async function loadConfig(): Promise<Config> {
    const mod = await import('../../src/config')
    return (mod.default as unknown as () => Config)()
  }

  describe('required environment variables', () => {
    const cases = [
      {
        name: 'throws when STEAM_API_KEY is missing',
        env: { SECRET: 'test-secret' },
        error: 'Missing required environment variable: STEAM_API_KEY',
      },
      {
        name: 'throws when SECRET is missing',
        env: { STEAM_API_KEY: 'test-key' },
        error: 'Missing required environment variable: SECRET',
      },
    ]

    it.each(cases)('$name', async ({ env, error }) => {
      Object.assign(process.env, env)
      await expect(loadConfig()).rejects.toThrow(error)
    })
  })

  describe('default values', () => {
    it('uses defaults when only required vars are set', async () => {
      process.env.STEAM_API_KEY = 'test-key'
      process.env.SECRET = 'test-secret'
      const cfg = await loadConfig()

      expect(cfg.server.host).toBe('localhost')
      expect(cfg.server.port).toBe(80)
      expect(cfg.server.https_port).toBe(443)
      expect(cfg.server.steam_api_key).toBe('test-key')
      expect(cfg.server.secret).toBe('test-secret')
      expect(cfg.server.website_url).toBe(false)
      expect(cfg.db.host).toBe('db')
      expect(cfg.db.port).toBe(5432)
      expect(cfg.db.ssl).toBe(false)
      expect(cfg.db.max).toBe(10)
      expect(cfg.db.idleTimeoutMillis).toBe(30000)
      expect(cfg.templates.title).toBe('RD2L')
    })
  })

  describe('optional overrides', () => {
    const cases = [
      {
        name: 'HOST override',
        env: { STEAM_API_KEY: 'k', SECRET: 's', HOST: 'example.com' },
        path: ['server', 'host'] as const,
        expected: 'example.com',
      },
      {
        name: 'PORT override',
        env: { STEAM_API_KEY: 'k', SECRET: 's', PORT: '3000' },
        path: ['server', 'port'] as const,
        expected: '3000',
      },
      {
        name: 'HTTPS_PORT override',
        env: { STEAM_API_KEY: 'k', SECRET: 's', HTTPS_PORT: '8443' },
        path: ['server', 'https_port'] as const,
        expected: '8443',
      },
      {
        name: 'POSTGRES_HOST override',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_HOST: 'pg.local' },
        path: ['db', 'host'] as const,
        expected: 'pg.local',
      },
      {
        name: 'POSTGRES_PORT override',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_PORT: '5433' },
        path: ['db', 'port'] as const,
        expected: '5433',
      },
      {
        name: 'POSTGRES_POOL_MAX override',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_POOL_MAX: '20' },
        path: ['db', 'max'] as const,
        expected: '20',
      },
      {
        name: 'POSTGRES_TIMEOUT override',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_TIMEOUT: '60000' },
        path: ['db', 'idleTimeoutMillis'] as const,
        expected: '60000',
      },
    ]

    it.each(cases)('$name', async ({ env, path, expected }) => {
      Object.assign(process.env, env)
      const cfg = await loadConfig()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((cfg as any)[path[0]][path[1]]).toBe(expected)
    })
  })

  describe('WEBSITE_URL', () => {
    const cases = [
      {
        name: 'absent returns false',
        env: { STEAM_API_KEY: 'k', SECRET: 's' },
        expected: false as const,
      },
      {
        name: 'present is prefixed with //',
        env: { STEAM_API_KEY: 'k', SECRET: 's', WEBSITE_URL: 'example.com' },
        expected: '//example.com',
      },
    ]

    it.each(cases)('$name', async ({ env, expected }) => {
      Object.assign(process.env, env)
      const cfg = await loadConfig()
      expect(cfg.server.website_url).toBe(expected)
    })
  })

  describe('POSTGRES_SSL', () => {
    const cases = [
      {
        name: 'absent returns false',
        env: { STEAM_API_KEY: 'k', SECRET: 's' },
        expected: false,
      },
      {
        name: 'present returns true',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_SSL: 'true' },
        expected: true,
      },
      {
        name: 'any truthy string returns true',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_SSL: '1' },
        expected: true,
      },
    ]

    it.each(cases)('$name', async ({ env, expected }) => {
      Object.assign(process.env, env)
      const cfg = await loadConfig()
      expect(cfg.db.ssl).toBe(expected)
    })
  })

  describe('database user/password fallbacks', () => {
    const cases = [
      {
        name: 'POSTGRES_USER takes precedence over PGUSER',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_USER: 'pg1', PGUSER: 'pg2' },
        field: 'user',
        expected: 'pg1',
      },
      {
        name: 'PGUSER used when POSTGRES_USER absent',
        env: { STEAM_API_KEY: 'k', SECRET: 's', PGUSER: 'pg2' },
        field: 'user',
        expected: 'pg2',
      },
      {
        name: 'user is false when both absent',
        env: { STEAM_API_KEY: 'k', SECRET: 's' },
        field: 'user',
        expected: false,
      },
      {
        name: 'POSTGRES_PASSWORD takes precedence over PGPASSWORD',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_PASSWORD: 'pw1', PGPASSWORD: 'pw2' },
        field: 'password',
        expected: 'pw1',
      },
      {
        name: 'PGPASSWORD used when POSTGRES_PASSWORD absent',
        env: { STEAM_API_KEY: 'k', SECRET: 's', PGPASSWORD: 'pw2' },
        field: 'password',
        expected: 'pw2',
      },
      {
        name: 'POSTGRES_DB takes precedence over PGDATABASE',
        env: { STEAM_API_KEY: 'k', SECRET: 's', POSTGRES_DB: 'db1', PGDATABASE: 'db2' },
        field: 'database',
        expected: 'db1',
      },
      {
        name: 'PGDATABASE used when POSTGRES_DB absent',
        env: { STEAM_API_KEY: 'k', SECRET: 's', PGDATABASE: 'db2' },
        field: 'database',
        expected: 'db2',
      },
    ]

    it.each(cases)('$name', async ({ env, field, expected }) => {
      Object.assign(process.env, env)
      const cfg = await loadConfig()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((cfg.db as any)[field]).toBe(expected)
    })
  })
})
