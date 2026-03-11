import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertDivision } from '../helpers/fixtures'
import divisionRepo from '../../src/repos/division'

describe.runIf(isDockerAvailable())('division repo', () => {
  let division: ReturnType<typeof divisionRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    division = divisionRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('getDivisions', () => {
    it('returns empty array when no divisions exist', async () => {
      const result = await division.getDivisions()
      expect(result).toEqual([])
    })

    it('returns all divisions ordered by name', async () => {
      const pool = getPool()
      await insertDivision(pool, { id: 1, name: 'Bravo' })
      await insertDivision(pool, { id: 2, name: 'Alpha' })

      const result = await division.getDivisions()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Alpha')
      expect(result[1].name).toBe('Bravo')
    })

    const filterCases = [
      {
        name: 'filters active divisions',
        divisions: [
          { id: 1, name: 'Active', active: true },
          { id: 2, name: 'Inactive', active: false },
        ],
        criteria: { active: true },
        expectedCount: 1,
        expectedName: 'Active',
      },
      {
        name: 'filters inactive divisions',
        divisions: [
          { id: 1, name: 'Active', active: true },
          { id: 2, name: 'Inactive', active: false },
        ],
        criteria: { active: false },
        expectedCount: 1,
        expectedName: 'Inactive',
      },
    ]

    it.each(filterCases)('$name', async ({ divisions, criteria, expectedCount, expectedName }) => {
      const pool = getPool()
      for (const d of divisions) {
        await insertDivision(pool, d)
      }
      const result = await division.getDivisions(criteria)
      expect(result).toHaveLength(expectedCount)
      expect(result[0].name).toBe(expectedName)
    })
  })

  describe('getDivision', () => {
    it('returns a division by id', async () => {
      const pool = getPool()
      await insertDivision(pool, { id: 1, name: 'Test Div', active: true })
      const result = await division.getDivision(1)
      expect(result.name).toBe('Test Div')
    })
  })

  describe('saveDivision', () => {
    it('upserts a division', async () => {
      await division.saveDivision({ id: 1, name: 'Original', active: true, discord_url: '', start_time: '', draft_sheet_url: '' })
      await division.saveDivision({ id: 1, name: 'Updated', active: false, discord_url: '', start_time: '', draft_sheet_url: '' })
      const result = await division.getDivision(1)
      expect(result.name).toBe('Updated')
      expect(result.active).toBe(false)
    })
  })

  describe('deleteDivision', () => {
    it('deletes a division', async () => {
      const pool = getPool()
      await insertDivision(pool, { id: 1, name: 'To Delete' })
      await division.deleteDivision(1)
      const result = await division.getDivision(1)
      expect(result).toBeUndefined()
    })
  })
})
