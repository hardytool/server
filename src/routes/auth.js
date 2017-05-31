var sql = require('pg-sql').sql
var BigNumber = require('bignumber.js')
var Promises = require('bluebird')

function steamIdReturn(config, req, res) {
  if (!config.server.website_url) {
    res.redirect('/')
  } else {
    res.redirect(config.server.website_url)
  }
}

function steamPassport(db, identifier, profile, done) {
  var id = from64to32(profile.id)
  var name = profile.displayName
  var avatar = profile.photos[profile.photos.length - 1].value
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
    0,
    0
  )
  ON CONFLICT (
    steam_id
  ) DO UPDATE SET (
    name,
    avatar
  ) = (
    ${name},
    ${avatar}
  )
  `
  Promises.all(db.query(upsert).then(() => {
    }).catch(err => {
      if (err) {
        console.error(err)
      }
    })
  )
  return done(null, { id: identifier, profile: profile })
}

function expandUser(db, user) {
  var id = from64to32(user.profile.id)
  var select = sql`
  SELECT
    COUNT(*) > 0 AS is_admin
  FROM
    admin
  WHERE
    steam_id = ${id.toString()}
  `
  console.dir(select, {depth: null})
  return db.query(select).then(result => {
    user.isAdmin = result.rows[0].is_admin
    return Promise.resolve(user)
  })
}

function logout(config, req, res) {
  if (req.user) {
    req.logout()
  }

  if (!config.server.website_url) {
    res.redirect('/')
  } else {
    res.redirect(config.server.website_url)
  }
}

function from64to32(id) {
  var id64 = new BigNumber(id)
  var diff = new BigNumber('76561197960265728')
  var id32 = id64.minus(diff)
  return id32
}

module.exports = function(config, db) {
  return {
    steamIdReturn: steamIdReturn.bind(null, config),
    steamPassport: steamPassport.bind(null, db),
    expandUser: expandUser.bind(null, db),
    logout: logout.bind(null, config)
  }
}
