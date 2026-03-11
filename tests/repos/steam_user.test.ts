import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSteamUser, insertSeason, insertDivision, insertPlayer } from '../helpers/fixtures'
import steamUserRepo from '../../src/repos/steam_user'

describe.runIf(isDockerAvailable())('steam_user repo', () => {
  let steamUser: ReturnType<typeof steamUserRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    steamUser = steamUserRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('getSteamUsers', () => {
    it('returns empty when no users', async () => {
      const result = await steamUser.getSteamUsers()
      expect(result).toEqual([])
    })

    it('returns all steam users', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'u1', name: 'Alice' })
      await insertSteamUser(pool, { steam_id: 'u2', name: 'Bob' })

      const result = await steamUser.getSteamUsers()
      expect(result).toHaveLength(2)
    })
  })

  describe('getSteamUser', () => {
    it('returns a user by steam_id', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'u1', name: 'Alice', mmr: 4000 })

      const result = await steamUser.getSteamUser('u1')
      expect(result).toBeDefined()
      expect(result!.name).toBe('Alice')
      expect(result!.mmr).toBe(4000)
    })

    it('returns undefined for non-existent user', async () => {
      const result = await steamUser.getSteamUser('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('saveSteamUser', () => {
    it('upserts a steam user', async () => {
      await steamUser.saveSteamUser({ steam_id: 'u1', name: 'Original', avatar: '', mmr: 1000, rank_tier: 20 })
      await steamUser.saveSteamUser({ steam_id: 'u1', name: 'Updated', avatar: 'new.jpg', mmr: 2000, rank_tier: 30 })

      const result = await steamUser.getSteamUser('u1')
      expect(result!.name).toBe('Updated')
      expect(result!.mmr).toBe(2000)
    })
  })

  describe('deleteSteamUser', () => {
    it('deletes a steam user', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'u1', name: 'Delete Me' })
      await steamUser.deleteSteamUser('u1')
      const result = await steamUser.getSteamUser('u1')
      expect(result).toBeUndefined()
    })
  })

  describe('getSteamUsersMissingMMR', () => {
    it('returns users with 0 MMR registered in a season', async () => {
      const pool = getPool()
      const s = await insertSeason(pool, { id: 1, number: 1, name: 'S1' })
      const d = await insertDivision(pool, { id: 1, name: 'D1' })
      await insertSteamUser(pool, { steam_id: 'zero', name: 'ZeroMMR', mmr: 0, rank_tier: 0 })
      await insertSteamUser(pool, { steam_id: 'nonzero', name: 'HasMMR', mmr: 3000, rank_tier: 50 })
      await insertPlayer(pool, { id: 1, season_id: s.id, division_id: d.id, steam_id: 'zero' })
      await insertPlayer(pool, { id: 2, season_id: s.id, division_id: d.id, steam_id: 'nonzero' })

      const result = await steamUser.getSteamUsersMissingMMR(s.id)
      expect(result).toHaveLength(1)
      expect(result[0].steam_id).toBe('zero')
    })
  })
})
