import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds } from '../helpers/fixtures'
import roleRepo from '../../src/repos/role'

describe.runIf(isDockerAvailable())('role repo', () => {
  let role: ReturnType<typeof roleRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    role = roleRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('getRoles', () => {
    it('returns empty array when no roles', async () => {
      const result = await role.getRoles()
      expect(result).toEqual([])
    })

    it('returns all roles', async () => {
      await role.saveRole({ id: 1, name: 'Carry' })
      await role.saveRole({ id: 2, name: 'Support' })

      const result = await role.getRoles()
      expect(result).toHaveLength(2)
    })

    it('filters by role_id', async () => {
      await role.saveRole({ id: 1, name: 'Carry' })
      await role.saveRole({ id: 2, name: 'Support' })

      const result = await role.getRoles({ role_id: 1 })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Carry')
    })
  })

  describe('saveRole', () => {
    it('upserts a role', async () => {
      await role.saveRole({ id: 1, name: 'Original' })
      await role.saveRole({ id: 1, name: 'Updated' })

      const result = await role.getRoles({ role_id: 1 })
      expect(result[0].name).toBe('Updated')
    })
  })

  describe('deleteRole', () => {
    it('deletes a role', async () => {
      await role.saveRole({ id: 1, name: 'ToDelete' })
      await role.deleteRole(1)

      const result = await role.getRoles()
      expect(result).toEqual([])
    })
  })
})
