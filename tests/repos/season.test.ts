import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSeason, insertDivision } from '../helpers/fixtures'
import seasonRepo from '../../src/repos/season'

describe.runIf(isDockerAvailable())('season repo', () => {
  let season: ReturnType<typeof seasonRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    season = seasonRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('getSeasons', () => {
    it('returns empty array when no seasons exist', async () => {
      const result = await season.getSeasons()
      expect(result).toEqual([])
    })

    it('returns seasons ordered by number ASC', async () => {
      const pool = getPool()
      await insertSeason(pool, { id: 1, number: 2, name: 'Second' })
      await insertSeason(pool, { id: 2, number: 1, name: 'First' })

      const result = await season.getSeasons()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('First')
      expect(result[1].name).toBe('Second')
    })
  })

  describe('getSeason', () => {
    it('returns a season by id', async () => {
      const pool = getPool()
      await insertSeason(pool, { id: 1, number: 1, name: 'Test Season', active: true })

      const result = await season.getSeason(1)
      expect(result.name).toBe('Test Season')
      expect(result.active).toBe(true)
    })

    it('returns undefined for non-existent id', async () => {
      const result = await season.getSeason(999)
      expect(result).toBeUndefined()
    })
  })

  describe('getActiveSeason', () => {
    const cases = [
      {
        name: 'returns active season',
        seasons: [
          { id: 1, number: 1, name: 'Inactive', active: false },
          { id: 2, number: 2, name: 'Active', active: true },
        ],
        expected: 'Active',
      },
      {
        name: 'returns undefined when none active',
        seasons: [
          { id: 1, number: 1, name: 'Inactive', active: false },
        ],
        expected: undefined,
      },
    ]

    it.each(cases)('$name', async ({ seasons, expected }) => {
      const pool = getPool()
      for (const s of seasons) {
        await insertSeason(pool, s)
      }
      const result = await season.getActiveSeason()
      if (expected === undefined) {
        expect(result).toBeUndefined()
      } else {
        expect(result?.name).toBe(expected)
      }
    })
  })

  describe('saveSeason', () => {
    it('inserts a new season', async () => {
      await season.saveSeason({ id: 1, number: 1, name: 'New', active: false, activity_check: false, registration_open: false })
      const result = await season.getSeason(1)
      expect(result.name).toBe('New')
    })

    it('upserts an existing season', async () => {
      await season.saveSeason({ id: 1, number: 1, name: 'Original', active: false, activity_check: false, registration_open: false })
      await season.saveSeason({ id: 1, number: 1, name: 'Updated', active: true, activity_check: false, registration_open: false })
      const result = await season.getSeason(1)
      expect(result.name).toBe('Updated')
      expect(result.active).toBe(true)
    })
  })

  describe('deleteSeason', () => {
    it('deletes a season by id', async () => {
      const pool = getPool()
      await insertSeason(pool, { id: 1, number: 1, name: 'To Delete' })
      await season.deleteSeason(1)
      const result = await season.getSeason(1)
      expect(result).toBeUndefined()
    })
  })

  describe('startSeason', () => {
    it('creates round entries for each division', async () => {
      const pool = getPool()
      await insertSeason(pool, { id: 1, number: 1, name: 'S1' })
      await insertDivision(pool, { id: 10, name: 'Div A' })
      await insertDivision(pool, { id: 20, name: 'Div B' })

      await season.startSeason(['10', '20'], 1)

      const result = await pool.query('SELECT * FROM round WHERE season_id = $1', [1])
      expect(result.rows).toHaveLength(2)
      expect(result.rows.map((r: { division_id: string }) => r.division_id).sort()).toEqual(['10', '20'])
    })
  })
})
