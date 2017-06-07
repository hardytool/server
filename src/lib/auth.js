var sql = require('pg-sql').sql
var BigNumber = require('bignumber.js')

function createUser(db, mmr, profile, cb) {
  var id = from64to32(profile.id)
  var name = profile.displayName
  var avatar = getAvatar(profile)
  mmr.getMMR(id, (err, result) => {
    var upsert = sql`
    INSERT INTO steam_user (
      steam_id,
      name,
      avatar,
      solo_mmr,
      party_mmr
    ) VALUES (
      ${id.toString()},
      ${name},
      ${avatar},
      ${result ? result.solo : 0},
      ${result ? result.party : 0}
    )
    ON CONFLICT (
      steam_id
    ) DO UPDATE SET (
      name,
      avatar,
      solo_mmr,
      party_mmr
    ) = (
      ${name},
      ${avatar},
      ${result ? result.solo : 0},
      ${result ? result.party : 0}
    )
    `
    db.query(upsert).then(() => {
      cb(null, null)
    }).catch(err => {
      cb(err, null)
    })
  })
}

function inflateUser(db, user) {
  var id = from64to32(user.profile.id)
  var select = sql`
  SELECT
    COUNT(*) > 0 AS is_admin
  FROM
    admin
  WHERE
    steam_id = ${id.toString()}
  `
  return db.query(select).then(result => {
    user.isAdmin = result.rows[0].is_admin
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

module.exports = (config, db, mmr) => {
  return {
    createUser: createUser.bind(null, db, mmr),
    inflateUser: inflateUser.bind(null, db),
    getAvatar: getAvatar
  }
}
