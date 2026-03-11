import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSeason } from '../helpers/fixtures'
import seasonRepo from '../../src/repos/season'
import apiSeasonsFactory from '../../src/api/seasons'

describe.runIf(isDockerAvailable())('API: seasons', () => {
  let app: express.Express

  beforeAll(async () => {
    const pool = await setupDatabase()
    const season = seasonRepo(pool)
    const apiSeasons = apiSeasonsFactory(season)

    app = express()
    app.use(express.json())
    app.get(apiSeasons.list.route, apiSeasons.list.handler)
    app.get(apiSeasons.view.route, apiSeasons.view.handler)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('GET /api/v1/seasons', () => {
    it('returns empty array when no seasons', async () => {
      const res = await request(app).get('/api/v1/seasons')
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it('returns all seasons', async () => {
      const pool = getPool()
      await insertSeason(pool, { id: 1, number: 1, name: 'Season 1' })
      await insertSeason(pool, { id: 2, number: 2, name: 'Season 2' })

      const res = await request(app).get('/api/v1/seasons')
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
    })
  })

  describe('GET /api/v1/seasons/:id', () => {
    it('returns a specific season', async () => {
      const pool = getPool()
      await insertSeason(pool, { id: 1, number: 1, name: 'Test Season' })

      const res = await request(app).get('/api/v1/seasons/1')
      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Test Season')
    })
  })
})
