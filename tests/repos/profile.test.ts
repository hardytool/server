import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSteamUser, insertProfile, insertSeason, insertDivision, insertPlayer } from '../helpers/fixtures'
import profileRepo from '../../src/repos/profile'

describe.runIf(isDockerAvailable())('profile repo', () => {
  let profile: ReturnType<typeof profileRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    profile = profileRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('getProfile', () => {
    it('returns profile for a steam user', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'u1', name: 'Alice' })
      await insertProfile(pool, 'u1', { name: 'CustomAlice', theme: 'dark' })

      const result = await profile.getProfile('u1')
      expect(result).toBeDefined()
      expect(result!.name).toBe('CustomAlice')
      expect(result!.theme).toBe('dark')
    })

    it('returns undefined when no profile exists', async () => {
      const result = await profile.getProfile('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('saveProfile', () => {
    it('upserts a profile', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'u1', name: 'Alice' })

      await profile.saveProfile({ steam_id: 'u1', name: 'First', faceit_name: null, discord_name: null, adjusted_mmr: null, name_locked: false, theme: 'default' })
      await profile.saveProfile({ steam_id: 'u1', name: 'Updated', faceit_name: 'alice_faceit', discord_name: 'alice#1234', adjusted_mmr: 4500, name_locked: true, theme: 'dark' })

      const result = await profile.getProfile('u1')
      expect(result!.name).toBe('Updated')
      expect(result!.faceit_name).toBe('alice_faceit')
      expect(result!.adjusted_mmr).toBe(4500)
    })
  })

  describe('getActivityCheck', () => {
    it('returns activity check for player in active season', async () => {
      const pool = getPool()
      const s = await insertSeason(pool, { id: 1, number: 1, name: 'Active', active: true, activity_check: true })
      const d = await insertDivision(pool, { id: 1, name: 'D1' })
      await insertSteamUser(pool, { steam_id: 'u1', name: 'Alice' })
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'u1', activity_check: false })

      const result = await profile.getActivityCheck('u1')
      expect(result).toBeDefined()
      expect(result!.activity_check).toBe(false)
    })

    it('returns undefined when no active season registration', async () => {
      const result = await profile.getActivityCheck('nonexistent')
      expect(result).toBeUndefined()
    })
  })
})
