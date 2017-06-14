var BigNumber = require('bignumber.js')

function createUser(steam_user, mmr, profile) {
  var id = from64to32(profile.id)
  var name = profile.displayName
  var avatar = getAvatar(profile)
  return steam_user.getSteamUser(id.toString()).then(user => {
    return user
  }).catch(() => {
    return null
  }).then(existingUser => {
    return mmr.getMMR(id).then(result => {
      var currentSolo = existingUser ? existingUser.solo_mmr : 0
      var currentParty = existingUser ? existingUser.party_mmr : 0
      var user = {
        steam_id: id.toString(),
        name: name,
        avatar: avatar,
        solo_mmr: result && result.solo ? result.solo : currentSolo,
        party_mmr: result && result.party ? result.party : currentParty
      }
      return steam_user.saveSteamUser(user).then(() => {
        return user
      })
    })
  })
}

function updateUserMMR(steam_user, mmr, user) {
  return mmr.getMMR(user.steam_id).then(result => {
    user.solo_mmr = result && result.soll ? result.solo : user.solo_mmr
    user.party_mmr = result && result.party ? result.party : user.party_mmr
    return steam_user.saveSteamUser(user).then(() => {
      return user
    })
  })
}

function inflateUser(admin, user) {
  var id = from64to32(user.profile.id).toString()

  return admin.isAdmin(id).then(isAdmin => {
    user.isAdmin = isAdmin
    user.avatar = getAvatar(user.profile)
    user.displayName = user.profile.displayName
    return Promise.resolve(user)
  })
}

function from64to32(id) {
  var id64 = new BigNumber(id)
  var diff = new BigNumber('76561197960265728')
  var id32 = id64.minus(diff)
  return id32
}

function getAvatar(profile) {
  return profile.photos[profile.photos.length - 1].value
}

module.exports = (config, admin, steam_user, mmr) => {
  return {
    createUser: createUser.bind(null, steam_user, mmr),
    updateUserMMR: updateUserMMR.bind(null, steam_user, mmr),
    inflateUser: inflateUser.bind(null, admin),
    getAvatar: getAvatar
  }
}
