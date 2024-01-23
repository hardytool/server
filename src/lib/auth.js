const timeout = require('./timeout.js')

function createUser(steam_user, profile, steamId, user_profile) {
  const id = steamId.from64to32(user_profile.id)
  const name = user_profile.displayName
  const avatar = getAvatar(user_profile)
  return steam_user.getSteamUser(id.toString()).then(user => {
    return user
  }).catch(() => {
    return null
  }).then(existingUser => {
    const currentSolo = existingUser ? existingUser.solo_mmr : 0
    const currentParty = existingUser ? existingUser.party_mmr : 0
    const currentRank = existingUser ? existingUser.rank : 0
    const previousRank = existingUser ? existingUser.previousRank : 0
    const user = {
      steam_id: id.toString(),
      name: name,
      avatar: avatar,
      solo_mmr: currentSolo,
      party_mmr: currentParty,
      rank: currentRank,
      previousRank: previousRank
    }
    return user
  }).then(user => {
    return steam_user.saveSteamUser(user).then(() => {
      return profile.getProfile(user.steam_id).then(_profile => {
        _profile.steam_id = _profile && _profile.steam_id ? _profile.steam_id : user.steam_id
        _profile.faceit_name = _profile && _profile.faceit_name ? _profile.faceit_name : null
        _profile.discord_name = _profile && _profile.discord_name ? _profile.discord_name : null
        _profile.adjusted_mmr = _profile && _profile.adjusted_mmr ? _profile.adjusted_mmr : null
        _profile.name_locked = _profile && _profile.name_locked ? _profile.name_locked : false
        _profile.theme = _profile && _profile.theme ? _profile.theme : 'default'
        return profile.saveProfile(_profile).then(() => {
          return user
        })
      })
    })
  })
}

function inflateUser(admin, profile, steamId, user) {
  const id = steamId.from64to32(user.profile.id).toString()

  return admin.isAdmin(id).then(isAdmin => {
    return profile.getProfile(id).then(profile => {
      user.isAdmin = isAdmin
      user.avatar = getAvatar(user.profile)
      user.displayName = profile.name
      user.steamId = id
      user.theme = profile.theme
      return user
    }).then((user) => {
      return profile.getActivityCheck(id).then((activityCheckRecord) => {
        user.activityCheckRequired = (activityCheckRecord && activityCheckRecord.activity_check === false)
        return user
      })
    })
  })
}

function getAvatar(profile) {
  return profile.photos[profile.photos.length - 1].value
}

module.exports = (admin, steam_user, profile, mmr, steamId) => {
  return {
    createUser: createUser.bind(null, steam_user, profile, steamId),
    inflateUser: inflateUser.bind(null, admin, profile, steamId),
    getAvatar: getAvatar
  }
}
