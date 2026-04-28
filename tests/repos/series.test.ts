import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSeason, insertDivision, insertTeam } from '../helpers/fixtures'
import seriesRepo from '../../src/repos/series'
import type { Series } from '../../src/types/db'

describe.runIf(isDockerAvailable())('series repo', () => {
  let series: ReturnType<typeof seriesRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    series = seriesRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('home/away required constraint', () => {
    function buildSeries(home_team_id: number | null, away_team_id: number | null): Partial<Series> {
      return {
        id: 1,
        round: 1,
        season_id: 1,
        home_team_id,
        away_team_id,
        home_points: 0,
        away_points: 0,
        is_playoff: false,
      } as unknown as Partial<Series>
    }

    it('rejects a series with no home and no away team', async () => {
      const pool = getPool()
      await insertSeason(pool, { id: 1 })
      await insertDivision(pool, { id: 1 })

      await expect(
        series.saveSeries(buildSeries(null, null))
      ).rejects.toThrow(/series_home_or_away_required/)
    })

    it('allows a BYE on the away side', async () => {
      const pool = getPool()
      const s = await insertSeason(pool, { id: 1 })
      const d = await insertDivision(pool, { id: 1 })
      const home = await insertTeam(pool, { id: 1, season_id: s.id, division_id: d.id })

      await expect(
        series.saveSeries(buildSeries(home.id as number, null))
      ).resolves.toBeDefined()
    })

    it('allows a BYE on the home side', async () => {
      const pool = getPool()
      const s = await insertSeason(pool, { id: 1 })
      const d = await insertDivision(pool, { id: 1 })
      const away = await insertTeam(pool, { id: 1, season_id: s.id, division_id: d.id })

      await expect(
        series.saveSeries(buildSeries(null, away.id as number))
      ).resolves.toBeDefined()
    })
  })
})
