import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'events'

function createMockSteamClient() {
  const emitter = new EventEmitter()
  return Object.assign(emitter, {
    logOn: vi.fn(),
    logOff: vi.fn(),
    gamesPlayed: vi.fn(),
  })
}

function createMockDota2Client() {
  const emitter = new EventEmitter()
  return Object.assign(emitter, {
    router: new EventEmitter(),
    send: vi.fn(),
  })
}

let lastSteamClient: ReturnType<typeof createMockSteamClient>
let lastDota2Client: ReturnType<typeof createMockDota2Client>

vi.mock('steam-user', () => {
  return {
    default: function MockSteamUser() {
      lastSteamClient = createMockSteamClient()
      return lastSteamClient
    },
  }
})

vi.mock('dota2-user', () => {
  function MockDota2User() {
    lastDota2Client = createMockDota2Client()
    return lastDota2Client
  }
  MockDota2User.STEAM_APPID = 570
  return { Dota2User: MockDota2User }
})

vi.mock('dota2-user/protobufs', () => ({
  EDOTAGCMsg: {
    k_EMsgClientToGCGetProfileCard: 7534,
    k_EMsgClientToGCGetProfileCardResponse: 7535,
  },
}))

vi.mock('dota2-user/protobufs/generated/dota_gcmessages_common', () => ({}))

vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

import createDota from '../../src/lib/dota'

describe('dota', () => {
  describe('connect', () => {
    it('logs into Steam and waits for GC connection', async () => {
      const dota = createDota({ username: 'bot', password: 'pass' })

      const connectPromise = dota.connect()

      expect(lastSteamClient.logOn).toHaveBeenCalledWith({
        accountName: 'bot',
        password: 'pass',
      })

      lastSteamClient.emit('loggedOn')
      expect(lastSteamClient.gamesPlayed).toHaveBeenCalledWith(570)

      lastDota2Client.emit('connectedToGC')
      await connectPromise

      expect(dota.isConnected()).toBe(true)
    })

    it('rejects on Steam error', async () => {
      const dota = createDota({ username: 'bot', password: 'pass' })

      const connectPromise = dota.connect()
      lastSteamClient.emit('error', new Error('Login failed'))

      await expect(connectPromise).rejects.toThrow('Login failed')
    })
  })

  describe('fetchMedal', () => {
    it('returns null when not connected', async () => {
      const dota = createDota({ username: 'bot', password: 'pass' })
      const result = await dota.fetchMedal('12345')
      expect(result).toBeNull()
    })

    it('sends GC message and returns rank tier', async () => {
      const dota = createDota({ username: 'bot', password: 'pass' })

      const connectPromise = dota.connect()
      lastSteamClient.emit('loggedOn')
      lastDota2Client.emit('connectedToGC')
      await connectPromise

      const medalPromise = dota.fetchMedal('12345')

      expect(lastDota2Client.send).toHaveBeenCalledWith(7534, { accountId: 12345 })

      lastDota2Client.router.emit(7535, { rankTier: 53 })

      const result = await medalPromise
      expect(result).toBe(53)
    })

    it('returns null on timeout', async () => {
      vi.useFakeTimers()
      const dota = createDota({ username: 'bot', password: 'pass' })

      const connectPromise = dota.connect()
      lastSteamClient.emit('loggedOn')
      lastDota2Client.emit('connectedToGC')
      await connectPromise

      const medalPromise = dota.fetchMedal('12345')
      vi.advanceTimersByTime(5000)

      const result = await medalPromise
      expect(result).toBeNull()
      vi.useRealTimers()
    })
  })

  describe('disconnect', () => {
    it('logs off Steam and marks as disconnected', async () => {
      const dota = createDota({ username: 'bot', password: 'pass' })

      const connectPromise = dota.connect()
      lastSteamClient.emit('loggedOn')
      lastDota2Client.emit('connectedToGC')
      await connectPromise

      dota.disconnect()

      expect(lastSteamClient.logOff).toHaveBeenCalled()
      expect(dota.isConnected()).toBe(false)
    })
  })
})
