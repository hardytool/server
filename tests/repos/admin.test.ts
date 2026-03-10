import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSteamUser, insertAdminGroup, insertAdmin, insertDivision } from '../helpers/fixtures'
import adminRepo from '../../src/repos/admin'

describe.runIf(isDockerAvailable())('admin repo', () => {
  let admin: ReturnType<typeof adminRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    admin = adminRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('isAdmin', () => {
    const cases = [
      { name: 'returns true for admin', isAdmin: true },
      { name: 'returns false for non-admin', isAdmin: false },
    ]

    it.each(cases)('$name', async ({ isAdmin: shouldBeAdmin }) => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'u1', name: 'User' })
      const group = await insertAdminGroup(pool, { id: 100, name: 'Admins' })
      if (shouldBeAdmin) {
        await insertAdmin(pool, 'u1', group.id)
      }

      const result = await admin.isAdmin('u1')
      expect(result).toBe(shouldBeAdmin)
    })
  })

  describe('getAdmins', () => {
    it('returns all admins', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'a1', name: 'Admin1' })
      await insertSteamUser(pool, { steam_id: 'a2', name: 'Admin2' })
      const group = await insertAdminGroup(pool, { id: 100, name: 'Admins' })
      await insertAdmin(pool, 'a1', group.id)
      await insertAdmin(pool, 'a2', group.id)

      const result = await admin.getAdmins()
      expect(result).toHaveLength(2)
    })

    it('filters by steam_id', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'a1', name: 'Admin1' })
      await insertSteamUser(pool, { steam_id: 'a2', name: 'Admin2' })
      const group = await insertAdminGroup(pool, { id: 100, name: 'Admins' })
      await insertAdmin(pool, 'a1', group.id)
      await insertAdmin(pool, 'a2', group.id)

      const result = await admin.getAdmins({ steam_id: 'a1' })
      expect(result).toHaveLength(1)
    })
  })

  describe('getDivisionAdmins', () => {
    it('returns admins assigned to a division', async () => {
      const pool = getPool()
      const d = await insertDivision(pool, { id: 1, name: 'D1' })
      await insertSteamUser(pool, { steam_id: 'a1', name: 'DivAdmin' })
      const group = await insertAdminGroup(pool, { id: 100, name: 'Mods' })
      await insertAdmin(pool, 'a1', group.id, d.id)

      const result = await admin.getDivisionAdmins(d.id)
      expect(result).toHaveLength(1)
    })
  })

  describe('saveAdmin + deleteAdmin', () => {
    it('creates and deletes an admin', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'a1', name: 'NewAdmin' })
      const group = await insertAdminGroup(pool, { id: 100, name: 'Admins' })

      await admin.saveAdmin({ steam_id: 'a1', group_id: String(group.id) })
      expect(await admin.isAdmin('a1')).toBe(true)

      await admin.deleteAdmin('a1')
      expect(await admin.isAdmin('a1')).toBe(false)
    })
  })
})
