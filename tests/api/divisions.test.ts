import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertDivision, insertSteamUser, insertAdminGroup, insertAdmin } from '../helpers/fixtures'
import divisionRepo from '../../src/repos/division'
import adminRepo from '../../src/repos/admin'
import apiDivisionsFactory from '../../src/api/divisions'

describe.runIf(isDockerAvailable())('API: divisions', () => {
  let app: express.Express

  beforeAll(async () => {
    const pool = await setupDatabase()
    const division = divisionRepo(pool)
    const admin = adminRepo(pool)
    const apiDivisions = apiDivisionsFactory(division, admin)

    app = express()
    app.use(express.json())
    app.get(apiDivisions.list.route, apiDivisions.list.handler)
    app.get(apiDivisions.view.route, apiDivisions.view.handler)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('GET /api/v1/divisions', () => {
    it('returns only active divisions', async () => {
      const pool = getPool()
      await insertDivision(pool, { id: 1, name: 'Active Div', active: true })
      await insertDivision(pool, { id: 2, name: 'Inactive Div', active: false })

      const res = await request(app).get('/api/v1/divisions')
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].name).toBe('Active Div')
    })
  })

  describe('GET /api/v1/divisions/:division_id', () => {
    it('returns division with admins', async () => {
      const pool = getPool()
      const d = await insertDivision(pool, { id: 1, name: 'Test Div' })
      await insertSteamUser(pool, { steam_id: 'a1', name: 'Admin' })
      const g = await insertAdminGroup(pool, { id: 100, name: 'Mods' })
      await insertAdmin(pool, 'a1', g.id, d.id)

      const res = await request(app).get('/api/v1/divisions/1')
      expect(res.status).toBe(200)
      expect(res.body.division.name).toBe('Test Div')
      expect(res.body.admins).toHaveLength(1)
    })
  })
})
