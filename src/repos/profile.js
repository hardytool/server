var sql = require('pg-sql').sql

function getProfile(db, steamId) {
  var select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.avatar,
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    COALESCE(profile.adjusted_mmr, 0) as adjusted_mmr,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE GREATEST(steam_user.solo_mmr, steam_user.party_mmr)
    END AS draft_mmr,
    profile.name_locked
  FROM
    profile
  RIGHT JOIN steam_user ON
    profile.steam_id = steam_user.steam_id
  WHERE
    steam_user.steam_id = ${steamId}
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
