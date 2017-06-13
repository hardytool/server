var BigNumber = require('bignumber.js')

function createUser(steam_user, mmr, profile, cb) {
  var id = from64to32(profile.id)
  var name = profile.displayName
  var avatar = getAvatar(profile)
  mmr.getMMR(id, (err, result) => {
    var user = {
      steam_id: id.toString(),
      name: name,
      avatar: avatar,
      solo_mmr: result ? result.solo : 0,
      party_mmr: result ? result.party : 0
    }
    steam_user.saveSteamUser(user).then(() => {
      cb(null, null)
    }).catch(err => {
      cb(err, null)
    })
  })
}

function updateUserMMR(steam_user, mmr, user) {
  mmr.getMMR(user.steam_id, (err, result) => {
    user.solo_mmr = result ? result.solo : 0
    user.party_mmr = result ? result.party : 0
    steam_user.saveSteamUser(user)
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
