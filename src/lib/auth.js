const timeout = require('./timeout.js')

function createUser(steam_user, mmr, steamId, profile) {
  const id = steamId.from64to32(profile.id)
  const name = profile.displayName
  const avatar = getAvatar(profile)
  return steam_user.getSteamUser(id.toString()).then(user => {
    return user
  }).catch(() => {
    return null
  }).then(existingUser => {
    const currentSolo = existingUser ? existingUser.solo_mmr : 0
    const currentParty = existingUser ? existingUser.party_mmr : 0
    const currentRank = existingUser ? existingUser.rank : 0
    const user = {
      steam_id: id.toString(),
      name: name,
      avatar: avatar,
      solo_mmr: currentSolo,
      party_mmr: currentParty,
      rank: currentRank
    }
    return mmr.getMMR(id).then(result => {
      user.solo_mmr = result && result.solo ? result.solo : user.solo_mmr
      user.party_mmr = result && result.party ? result.party : user.party_mmr
      user.rank = result && result.rank ? result.rank : user.rank
      return user
    }).catch(err => {
      console.error(err)
      return user
    })
  }).then(user => {
    return steam_user.saveSteamUser(user).then(() => {
      return user
    })
  })
}

let updated = false
function fetchMissingMMRs(steam_user, mmr, season_id, force) {
  if (!updated || force) {
    return steam_user.getSteamUsersMissingMMR(season_id).then(users => {
      updated = true
      return Promise.all(users.map((user) => {
        return updateUserMMR(steam_user, mmr, user).then(user => {
          console.log(`User ${user.steam_id} ${user.name} updated`)
        }).catch(err => {
          console.error(err)
        })
      })).catch(() => {
        // Doesn't matter if we have an error
        return null
      }).then(() => {
        return timeout(60 * 60 * 1000).then(() => {
          updated = false
        })
      })
    })
  } else {
    return Promise.resolve({ message: 'Sleeping' })
  }
}

function updateUserMMR(steam_user, mmr, user) {
  return mmr.getMMR(user.steam_id).then(result => {
    user.solo_mmr = result && result.solo ? result.solo : user.solo_mmr
    user.party_mmr = result && result.party ? result.party : user.party_mmr
    return steam_user.saveSteamUser(user).then(() => {
      return user
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
    })
  })
}

function getAvatar(profile) {
  return profile.photos[profile.photos.length - 1].value
}

module.exports = (admin, steam_user, profile, mmr, steamId) => {
  return {
    createUser: createUser.bind(null, steam_user, mmr, steamId),
    fetchMissingMMRs: fetchMissingMMRs.bind(null, steam_user, mmr),
    updateUserMMR: updateUserMMR.bind(null, steam_user, mmr),
    inflateUser: inflateUser.bind(null, admin, profile, steamId),
    getAvatar: getAvatar
  }
}
