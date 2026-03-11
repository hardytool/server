import { describe, it, expect, vi } from 'vitest'
import type { AdminRepo, SteamUserRepo, ProfileRepo } from '../../src/types/repos'
import createAuth from '../../src/lib/auth'

function makeSteamProfile(overrides?: Partial<{ id: string; displayName: string; photos: Array<{ value: string }> }>) {
  return {
    id: '76561198078205517',
    displayName: 'TestPlayer',
    photos: [{ value: 'small.jpg' }, { value: 'medium.jpg' }, { value: 'large.jpg' }],
    _json: { steamid: '76561198078205517', personaname: 'TestPlayer', avatar: '', avatarmedium: '', avatarfull: '' },
    ...overrides,
  }
}

function makeSteamId() {
  return {
    from64to32: (id: string) => ({ toString: () => String(BigInt(id) - BigInt('76561197960265728')) }),
    from32to64: (id: string | number) => ({ toString: () => String(BigInt(id) + BigInt('76561197960265728')) }),
  }
}

describe('auth', () => {
  describe('getAvatar', () => {
    const cases = [
      {
        name: 'returns last photo from multiple',
        photos: [{ value: 'small.jpg' }, { value: 'large.jpg' }],
        expected: 'large.jpg',
      },
      {
        name: 'returns single photo',
        photos: [{ value: 'only.jpg' }],
        expected: 'only.jpg',
      },
    ]

    it.each(cases)('$name', ({ photos, expected }) => {
      const steamId = makeSteamId()
      const admin = { isAdmin: vi.fn(), getAdmins: vi.fn(), getDivisionAdmins: vi.fn(), saveAdmin: vi.fn(), deleteAdmin: vi.fn() } as unknown as AdminRepo
      const steamUser = { getSteamUser: vi.fn(), getSteamUsers: vi.fn(), getSteamUsersMissingMMR: vi.fn(), getNonPlayerSteamUsers: vi.fn(), saveSteamUser: vi.fn(), deleteSteamUser: vi.fn() } as unknown as SteamUserRepo
      const profile = { getProfile: vi.fn(), saveProfile: vi.fn(), getActivityCheck: vi.fn() } as unknown as ProfileRepo
      const auth = createAuth(admin, steamUser, profile, steamId)
      const result = auth.getAvatar({ photos } as { photos: Array<{ value: string }> })
      expect(result).toBe(expected)
    })
  })

  describe('createUser', () => {
    function makeMocks(overrides?: {
      getSteamUser?: unknown
      getAdmins?: unknown[]
      getProfile?: unknown
    }) {
      const admin: AdminRepo = {
        isAdmin: vi.fn(),
        getAdmins: vi.fn().mockResolvedValue(overrides?.getAdmins ?? [{ steam_id: 'existing-admin' }]),
        getDivisionAdmins: vi.fn(),
        saveAdmin: vi.fn().mockResolvedValue(undefined),
        deleteAdmin: vi.fn(),
      }
      const steamUser: SteamUserRepo = {
        getSteamUser: vi.fn().mockResolvedValue(overrides?.getSteamUser ?? undefined),
        getSteamUsers: vi.fn(),
        getSteamUsersMissingMMR: vi.fn(),
        getNonPlayerSteamUsers: vi.fn(),
        saveSteamUser: vi.fn().mockResolvedValue(undefined),
        deleteSteamUser: vi.fn(),
      }
      const profile: ProfileRepo = {
        getProfile: vi.fn().mockResolvedValue(overrides?.getProfile ?? undefined),
        saveProfile: vi.fn().mockResolvedValue(undefined),
        getActivityCheck: vi.fn(),
      }
      return { admin, steamUser, profile }
    }

    const cases = [
      {
        name: 'new user with no admins creates first admin',
        mocks: { getSteamUser: undefined, getAdmins: [] },
        assertions: (admin: AdminRepo, steamUser: SteamUserRepo) => {
          expect(admin.saveAdmin).toHaveBeenCalledWith({ steam_id: '117939789', group_id: '_' })
          expect(steamUser.saveSteamUser).toHaveBeenCalledWith(expect.objectContaining({ solo_mmr: 0, party_mmr: 0 }))
        },
      },
      {
        name: 'new user with existing admins does not create admin',
        mocks: { getSteamUser: undefined, getAdmins: [{ steam_id: 'existing' }] },
        assertions: (admin: AdminRepo) => {
          expect(admin.saveAdmin).not.toHaveBeenCalled()
        },
      },
      {
        name: 'existing user preserves MMR values',
        mocks: {
          getSteamUser: { steam_id: '117939789', name: 'Old', avatar: 'old.jpg', solo_mmr: 3000, party_mmr: 2500 },
          getAdmins: [{ steam_id: 'admin' }],
        },
        assertions: (_admin: AdminRepo, steamUser: SteamUserRepo) => {
          expect(steamUser.saveSteamUser).toHaveBeenCalledWith(expect.objectContaining({
            solo_mmr: 3000,
            party_mmr: 2500,
          }))
        },
      },
    ]

    it.each(cases)('$name', async ({ mocks, assertions }) => {
      const { admin, steamUser, profile } = makeMocks(mocks)
      const steamId = makeSteamId()
      const auth = createAuth(admin, steamUser, profile, steamId)
      const steamProfile = makeSteamProfile()

      await auth.createUser(steamProfile)
      assertions(admin, steamUser)
    })

    it('saves profile with defaults for new user', async () => {
      const { admin, steamUser, profile } = makeMocks()
      const steamId = makeSteamId()
      const auth = createAuth(admin, steamUser, profile, steamId)

      await auth.createUser(makeSteamProfile())

      expect(profile.saveProfile).toHaveBeenCalledWith(expect.objectContaining({
        steam_id: '117939789',
        name: null,
        faceit_name: null,
        discord_name: null,
        adjusted_mmr: null,
        name_locked: false,
        theme: 'default',
      }))
    })
  })

  describe('inflateUser', () => {
    function makeMocks(overrides?: {
      isAdmin?: boolean
      profile?: unknown
      activityCheck?: unknown
    }) {
      const admin: AdminRepo = {
        isAdmin: vi.fn().mockResolvedValue(overrides?.isAdmin ?? false),
        getAdmins: vi.fn(),
        getDivisionAdmins: vi.fn(),
        saveAdmin: vi.fn(),
        deleteAdmin: vi.fn(),
      }
      const steamUser: SteamUserRepo = {
        getSteamUser: vi.fn(),
        getSteamUsers: vi.fn(),
        getSteamUsersMissingMMR: vi.fn(),
        getNonPlayerSteamUsers: vi.fn(),
        saveSteamUser: vi.fn(),
        deleteSteamUser: vi.fn(),
      }
      const profile: ProfileRepo = {
        getProfile: vi.fn().mockResolvedValue(overrides?.profile ?? undefined),
        saveProfile: vi.fn(),
        getActivityCheck: vi.fn().mockResolvedValue(overrides?.activityCheck ?? undefined),
      }
      return { admin, steamUser, profile }
    }

    const cases = [
      {
        name: 'admin user with custom profile name',
        mocks: {
          isAdmin: true,
          profile: { name: 'CustomName', theme: 'dark' },
          activityCheck: undefined,
        },
        expected: { isAdmin: true, displayName: 'CustomName', theme: 'dark', activityCheckRequired: false },
      },
      {
        name: 'non-admin without profile name uses Steam displayName',
        mocks: {
          isAdmin: false,
          profile: { name: null, theme: 'default' },
          activityCheck: undefined,
        },
        expected: { isAdmin: false, displayName: 'TestPlayer', theme: 'default', activityCheckRequired: false },
      },
      {
        name: 'activity check required when activity_check is false',
        mocks: {
          isAdmin: false,
          profile: { name: null, theme: 'default' },
          activityCheck: { activity_check: false },
        },
        expected: { isAdmin: false, activityCheckRequired: true },
      },
      {
        name: 'no activity check when activity_check is true',
        mocks: {
          isAdmin: false,
          profile: { name: null, theme: 'default' },
          activityCheck: { activity_check: true },
        },
        expected: { isAdmin: false, activityCheckRequired: false },
      },
    ]

    it.each(cases)('$name', async ({ mocks, expected }) => {
      const { admin, steamUser: _steamUser, profile } = makeMocks(mocks)
      const steamId = makeSteamId()
      const auth = createAuth(admin, _steamUser, profile, steamId)

      const user = {
        id: 'https://steamcommunity.com/openid/id/76561198078205517',
        profile: makeSteamProfile(),
      } as Express.User

      const result = await auth.inflateUser(user)
      expect(result.isAdmin).toBe(expected.isAdmin)
      if (expected.displayName) {
        expect(result.displayName).toBe(expected.displayName)
      }
      if (expected.theme) {
        expect(result.theme).toBe(expected.theme)
      }
      expect(result.activityCheckRequired).toBe(expected.activityCheckRequired)
      expect(result.steamId).toBe('117939789')
      expect(result.avatar).toBe('large.jpg')
    })
  })
})
