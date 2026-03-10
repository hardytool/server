import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds } from '../helpers/fixtures'
import bannedPlayerRepo from '../../src/repos/banned_player'

describe.runIf(isDockerAvailable())('banned_player repo', () => {
  let bannedPlayer: ReturnType<typeof bannedPlayerRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    bannedPlayer = bannedPlayerRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  describe('getBannedPlayers', () => {
    it('returns empty when no bans', async () => {
      const result = await bannedPlayer.getBannedPlayers()
      expect(result).toEqual([])
    })

    it('returns banned players', async () => {
      await bannedPlayer.saveBannedPlayer({ id: 1, steam_id: 'toxic1', name: 'Toxic Player', reason: 'Being toxic', banned_until: null })
      const result = await bannedPlayer.getBannedPlayers()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Toxic Player')
    })
  })

  describe('saveBannedPlayer + deleteBannedPlayer', () => {
    it('creates and deletes a ban', async () => {
      await bannedPlayer.saveBannedPlayer({ id: 1, steam_id: 'toxic1', name: 'Toxic', reason: 'Bad', banned_until: null })

      let result = await bannedPlayer.getBannedPlayers()
      expect(result).toHaveLength(1)

      await bannedPlayer.deleteBannedPlayer(1)
      result = await bannedPlayer.getBannedPlayers()
      expect(result).toEqual([])
    })
  })
})
