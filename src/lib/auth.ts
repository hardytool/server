import type { SteamProfile } from 'passport-steam'
import type { SteamUser } from '../types/db'
import type { AdminRepo, ProfileRepo, ProfileInput, SteamUserRepo } from '../types/repos'
import type { from64to32, from32to64 } from './steamId'

type SteamIdLib = {
  from64to32: typeof from64to32
  from32to64: typeof from32to64
}

function getAvatar(profile: SteamProfile): string {
  return profile.photos[profile.photos.length - 1].value
}

async function createUser(
  steam_user: SteamUserRepo,
  admin: AdminRepo,
  profile: ProfileRepo,
  steamId: SteamIdLib,
  user_profile: SteamProfile
): Promise<SteamUser> {
  const id = steamId.from64to32(user_profile.id).toString()
  const name = user_profile.displayName
  const avatar = getAvatar(user_profile)

  let existingUser: SteamUser | null
  try {
    existingUser = await steam_user.getSteamUser(id) ?? null
  } catch {
    existingUser = null
  }

  if (!existingUser) {
    const admins = await admin.getAdmins()
    if (admins.length === 0) {
      await admin.saveAdmin({ steam_id: id, group_id: '_' })
      console.log('Created first admin')
    }
  }

  const user: SteamUser = {
    steam_id: id,
    name,
    avatar,
    solo_mmr: existingUser?.solo_mmr ?? 0,
    party_mmr: existingUser?.party_mmr ?? 0,
  }

  await steam_user.saveSteamUser(user)

  const _profile = await profile.getProfile(user.steam_id)
  const profileData: ProfileInput = {
    steam_id: _profile?.steam_id ?? user.steam_id,
    name: _profile?.name ?? null,
    faceit_name: _profile?.faceit_name ?? null,
    discord_name: _profile?.discord_name ?? null,
    adjusted_mmr: _profile?.adjusted_mmr ?? null,
    name_locked: _profile?.name_locked ?? false,
    theme: _profile?.theme ?? 'default',
  }
  await profile.saveProfile(profileData)

  return user
}

async function inflateUser(
  admin: AdminRepo,
  profile: ProfileRepo,
  steamId: SteamIdLib,
  user: Express.User
): Promise<Express.User> {
  const id = steamId.from64to32(user.profile.id).toString()

  const isAdmin = await admin.isAdmin(id)
  const profileData = await profile.getProfile(id)

  user.isAdmin = isAdmin
  user.avatar = getAvatar(user.profile)
  user.displayName = profileData?.name ?? user.profile.displayName
  user.steamId = id
  user.theme = profileData?.theme ?? 'default'

  const activityCheckRecord = await profile.getActivityCheck(id)
  user.activityCheckRequired = activityCheckRecord?.activity_check === false

  return user
}

function createAuth(
  admin: AdminRepo,
  steam_user: SteamUserRepo,
  profile: ProfileRepo,
  steamId: SteamIdLib
) {
  return {
    createUser: createUser.bind(null, steam_user, admin, profile, steamId),
    inflateUser: inflateUser.bind(null, admin, profile, steamId),
    getAvatar,
  }
}

// export = so that require('./lib/auth') returns the factory directly,
// matching how server.js calls: require('./lib/auth')(admin, ...)
export = createAuth
