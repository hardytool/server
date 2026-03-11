import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds } from '../helpers/fixtures'
import adminGroupRepo from '../../src/repos/admin_group'

describe.runIf(isDockerAvailable())('admin_group repo', () => {
  let adminGroup: ReturnType<typeof adminGroupRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    adminGroup = adminGroupRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('getAdminGroups', () => {
    it('returns empty when no groups', async () => {
      const result = await adminGroup.getAdminGroups()
      expect(result).toEqual([])
    })

    it('returns all groups', async () => {
      await adminGroup.saveAdminGroup({ id: 1, name: 'Admins' })
      await adminGroup.saveAdminGroup({ id: 2, name: 'Mods' })

      const result = await adminGroup.getAdminGroups()
      expect(result).toHaveLength(2)
    })

    it('filters by admin_group_id', async () => {
      await adminGroup.saveAdminGroup({ id: 1, name: 'Admins' })
      await adminGroup.saveAdminGroup({ id: 2, name: 'Mods' })

      const result = await adminGroup.getAdminGroups({ admin_group_id: 1 })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Admins')
    })
  })

  describe('getAdminGroupNames', () => {
    it('returns id and name only', async () => {
      await adminGroup.saveAdminGroup({ id: 1, name: 'Admins' })

      const result = await adminGroup.getAdminGroupNames()
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
    })
  })

  describe('saveAdminGroup + deleteAdminGroup', () => {
    it('upserts and deletes', async () => {
      await adminGroup.saveAdminGroup({ id: 1, name: 'Original' })
      await adminGroup.saveAdminGroup({ id: 1, name: 'Updated' })

      let result = await adminGroup.getAdminGroups({ admin_group_id: 1 })
      expect(result[0].name).toBe('Updated')

      await adminGroup.deleteAdminGroup(1)
      result = await adminGroup.getAdminGroups()
      expect(result).toEqual([])
    })
  })
})
