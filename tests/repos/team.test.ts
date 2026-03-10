import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSeason, insertDivision, insertTeam } from '../helpers/fixtures'
import teamRepo from '../../src/repos/team'

describe.runIf(isDockerAvailable())('team repo', () => {
  let team: ReturnType<typeof teamRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    team = teamRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('getTeams', () => {
    it('returns teams for a season and division', async () => {
      const pool = getPool()
      const s = await insertSeason(pool, { id: 1, number: 1, name: 'S1' })
      const d = await insertDivision(pool, { id: 1, name: 'D1' })
      await insertTeam(pool, { id: 1, season_id: s.id, division_id: d.id, name: 'Team Alpha' })
      await insertTeam(pool, { id: 2, season_id: s.id, division_id: d.id, name: 'Team Bravo' })

      const result = await team.getTeams(s.id, d.id)
      expect(result).toHaveLength(2)
    })
  })

  describe('getTeam', () => {
    it('returns a team by id', async () => {
      const pool = getPool()
      const s = await insertSeason(pool, { id: 1, number: 1, name: 'S1' })
      const d = await insertDivision(pool, { id: 1, name: 'D1' })
      await insertTeam(pool, { id: 1, season_id: s.id, division_id: d.id, name: 'MyTeam' })

      const result = await team.getTeam(1)
      expect(result).toBeDefined()
      expect(result!.name).toBe('MyTeam')
    })

    it('returns undefined for non-existent team', async () => {
      const result = await team.getTeam(999)
      expect(result).toBeUndefined()
    })
  })

  describe('saveTeam', () => {
    it('upserts a team', async () => {
      const pool = getPool()
      const s = await insertSeason(pool, { id: 1, number: 1, name: 'S1' })
      const d = await insertDivision(pool, { id: 1, name: 'D1' })

      await team.saveTeam({ id: 1, season_id: s.id, division_id: d.id, name: 'Original', logo: '', team_number: 1, seed: 1, disbanded: false, standin_count: 0 })
      await team.saveTeam({ id: 1, season_id: s.id, division_id: d.id, name: 'Updated', logo: '', team_number: 1, seed: 2, disbanded: false, standin_count: 0 })

      const result = await team.getTeam(1)
      expect(result!.name).toBe('Updated')
      expect(result!.seed).toBe(2)
    })
  })

  describe('deleteTeam', () => {
    it('deletes a team', async () => {
      const pool = getPool()
      const s = await insertSeason(pool, { id: 1, number: 1, name: 'S1' })
      const d = await insertDivision(pool, { id: 1, name: 'D1' })
      await insertTeam(pool, { id: 1, season_id: s.id, division_id: d.id, name: 'Delete Me' })

      await team.deleteTeam(1)
      const result = await team.getTeam(1)
      expect(result).toBeUndefined()
    })
  })
})
