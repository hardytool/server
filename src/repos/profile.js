var sql = require('pg-sql').sql

function getProfile(db, steamId) {
  var select = sql`
  SELECT
    profile.steam_id,
    profile.name,
    profile.adjusted_mmr,
    profile.name_locked
  FROM
    profile
  WHERE
    profile.steam_id = ${steamId}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveProfile(db, profile) {
  var upsert = sql`
  INSERT INTO profile (
    steam_id,
    name,
    adjusted_mmr,
    name_locked
  ) VALUES (
    ${profile.steam_id},
    ${profile.name},
    ${profile.adjusted_mmr},
    ${profile.name_locked}
  )
  ON CONFLICT (
    steam_id
  ) DO UPDATE SET (
    name,
    adjusted_mmr,
    name_locked
  ) = (
    ${profile.name},
    ${profile.adjusted_mmr},
    ${profile.name_locked}
  )
  `
  return db.query(upsert)
}

module.exports = db => {
  return {
    getProfile: getProfile.bind(null, db),
    saveProfile: saveProfile.bind(null, db)
  }
}
