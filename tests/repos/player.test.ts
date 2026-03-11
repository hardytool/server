import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSeason, insertDivision, insertSteamUser, insertPlayer, insertTeam, insertTeamPlayer, insertProfile } from '../helpers/fixtures'
import playerRepo from '../../src/repos/player'

describe.runIf(isDockerAvailable())('player repo', () => {
  let player: ReturnType<typeof playerRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    player = playerRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  async function setupBaseData() {
    const pool = getPool()
    const s = await insertSeason(pool, { id: 1, number: 1, name: 'S1', active: true })
    const d = await insertDivision(pool, { id: 1, name: 'D1' })
    const u1 = await insertSteamUser(pool, { steam_id: 'p1', name: 'Alice', mmr: 4000, rank_tier: 60 })
    const u2 = await insertSteamUser(pool, { steam_id: 'p2', name: 'Bob', mmr: 3000, rank_tier: 40 })
    return { pool, s, d, u1, u2 }
  }

  describe('getPlayers', () => {
    it('returns empty array when no players', async () => {
      const result = await player.getPlayers()
      expect(result).toEqual([])
    })

    it('returns players for a season', async () => {
      const { pool, s, d } = await setupBaseData()
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1' })
      await insertPlayer(pool, { id: 101, season_id: s.id, division_id: d.id, steam_id: 'p2' })

      const result = await player.getPlayers({ season_id: s.id })
      expect(result).toHaveLength(2)
    })

    it('filters by division_id', async () => {
      const { pool, s, d } = await setupBaseData()
      const d2 = await insertDivision(pool, { id: 2, name: 'D2' })
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1' })
      await insertPlayer(pool, { id: 101, season_id: s.id, division_id: d2.id, steam_id: 'p2' })

      const result = await player.getPlayers({ season_id: s.id, division_id: d.id })
      expect(result).toHaveLength(1)
      expect(result[0].steam_id).toBe('p1')
    })

    it('sorts by name', async () => {
      const { pool, s, d } = await setupBaseData()
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p2' })
      await insertPlayer(pool, { id: 101, season_id: s.id, division_id: d.id, steam_id: 'p1' })

      const result = await player.getPlayers({ season_id: s.id }, { by_name: true })
      expect(result[0].name).toBe('Alice')
      expect(result[1].name).toBe('Bob')
    })
  })

  describe('getPlayer', () => {
    it('returns a player by id', async () => {
      const { pool, s, d } = await setupBaseData()
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1' })

      const result = await player.getPlayer(100)
      expect(result).toBeDefined()
      expect(result!.steam_id).toBe('p1')
    })

    it('returns undefined for non-existent player', async () => {
      const result = await player.getPlayer(999)
      expect(result).toBeUndefined()
    })
  })

  describe('savePlayer', () => {
    it('upserts a player', async () => {
      const { s, d } = await setupBaseData()
      await player.savePlayer({ id: 100, season_id: s.id as number, division_id: d.id, steam_id: 'p1', will_captain: 'no', captain_approved: false, statement: '', is_draftable: true, activity_check: false, mmr_screenshot: '' })
      await player.savePlayer({ id: 100, season_id: s.id as number, division_id: d.id, steam_id: 'p1', will_captain: 'yes', captain_approved: true, statement: 'updated', is_draftable: true, activity_check: false, mmr_screenshot: '' })

      const result = await player.getPlayer(100)
      expect(result!.will_captain).toBe('yes')
      expect(result!.captain_approved).toBe(true)
    })
  })

  describe('deletePlayer', () => {
    it('deletes a player', async () => {
      const { pool, s, d } = await setupBaseData()
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1' })
      await player.deletePlayer(100)
      const result = await player.getPlayer(100)
      expect(result).toBeUndefined()
    })
  })

  describe('unregisterPlayer', () => {
    it('removes a player by steam_id, season, and division', async () => {
      const { pool, s, d } = await setupBaseData()
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1' })
      await player.unregisterPlayer(s.id, d.id, 'p1')
      const result = await player.getPlayer(100)
      expect(result).toBeUndefined()
    })
  })

  describe('activityCheck', () => {
    it('sets activity_check to true', async () => {
      const { pool, s, d } = await setupBaseData()
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1', activity_check: false })

      await player.activityCheck(s.id, 'p1')

      const result = await player.getPlayer(100)
      expect(result!.activity_check).toBe(true)
    })
  })

  describe('hasFalseActivity', () => {
    const cases = [
      {
        name: 'returns count > 0 when player has false activity',
        activityCheck: false,
        expectedGt0: true,
      },
      {
        name: 'returns count 0 when player has true activity',
        activityCheck: true,
        expectedGt0: false,
      },
    ]

    it.each(cases)('$name', async ({ activityCheck, expectedGt0 }) => {
      const { pool, s, d } = await setupBaseData()
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1', activity_check: activityCheck })

      const result = await player.hasFalseActivity(s.id, 'p1')
      if (expectedGt0) {
        expect(Number(result.count)).toBeGreaterThan(0)
      } else {
        expect(Number(result.count)).toBe(0)
      }
    })
  })

  describe('getCurrentPlayerCount', () => {
    it('returns player counts grouped by division', async () => {
      const { pool, s, d } = await setupBaseData()
      const d2 = await insertDivision(pool, { id: 2, name: 'D2' })
      await insertSteamUser(pool, { steam_id: 'p3', name: 'Charlie' })
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1' })
      await insertPlayer(pool, { id: 101, season_id: s.id, division_id: d.id, steam_id: 'p2' })
      await insertPlayer(pool, { id: 102, season_id: s.id, division_id: d2.id, steam_id: 'p3' })

      const result = await player.getCurrentPlayerCount(s.id)
      expect(result).toHaveLength(2)
      const d1Count = result.find(r => r.name === 'D1')
      const d2Count = result.find(r => r.name === 'D2')
      expect(Number(d1Count!.count)).toBe(2)
      expect(Number(d2Count!.count)).toBe(1)
    })
  })

  describe('getDraftSheet', () => {
    it('returns only draftable players', async () => {
      const { pool, s, d } = await setupBaseData()
      await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1', is_draftable: true })
      await insertPlayer(pool, { id: 101, season_id: s.id, division_id: d.id, steam_id: 'p2', is_draftable: false })

      const result = await player.getDraftSheet({ season_id: s.id, division_id: d.id })
      expect(result).toHaveLength(1)
    })
  })
})
