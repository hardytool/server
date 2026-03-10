import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSteamUser } from '../helpers/fixtures'
import vouchRepo from '../../src/repos/vouch'

describe.runIf(isDockerAvailable())('vouch repo', () => {
  let vouch: ReturnType<typeof vouchRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    vouch = vouchRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('isVouched', () => {
    it('returns undefined for unvouched player', async () => {
      const result = await vouch.isVouched('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('vouch + isVouched', () => {
    it('vouches a player and confirms vouch status', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'voucher', name: 'Voucher' })
      await insertSteamUser(pool, { steam_id: 'vouchee', name: 'Vouchee' })

      await vouch.vouch('voucher', 'vouchee')

      const result = await vouch.isVouched('vouchee')
      expect(result).toBeDefined()
      expect(result!.is_vouched).toBe(true)
      expect(result!.voucher_id).toBe('voucher')
    })
  })

  describe('unvouch', () => {
    it('removes vouch status', async () => {
      const pool = getPool()
      await insertSteamUser(pool, { steam_id: 'voucher', name: 'Voucher' })
      await insertSteamUser(pool, { steam_id: 'vouchee', name: 'Vouchee' })

      await vouch.vouch('voucher', 'vouchee')
      await vouch.unvouch('vouchee')

      const result = await vouch.isVouched('vouchee')
      expect(result).toBeUndefined()
    })
  })
})
