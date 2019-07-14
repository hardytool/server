const sql = require('pg-sql').sql

function getProfile(db, steamId) {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.avatar,
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.name AS steam_name,
    profile.faceit_name as faceit_name,
    profile.discord_name as discord_name,
    profile.theme,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    player.activity_check as activity_check,
    COALESCE(profile.adjusted_mmr, 0) as adjusted_mmr,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE GREATEST(steam_user.solo_mmr, steam_user.party_mmr)
    END AS draft_mmr,
    COALESCE(profile.name_locked, false) AS name_locked,
    CASE
      WHEN admin.steam_id IS NOT NULL
      THEN true
      ELSE false
    END AS is_admin
  FROM
    steam_user
  LEFT JOIN profile ON
     steam_user.steam_id = profile.steam_id
  LEFT JOIN admin ON
    admin.steam_id = profile.steam_id
  LEFT JOIN player ON
    steam_user.steam_id = player.steam_id
  WHERE
    steam_user.steam_id = ${steamId}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveProfile(db, profile) {
  const upsert = sql`
  INSERT INTO profile (
    steam_id,
    name,
    faceit_name,
    discord_name,
    adjusted_mmr,
    name_locked,
    theme
  ) VALUES (
    ${profile.steam_id},
    ${profile.name},
    ${profile.faceit_name},
    ${profile.discord_name},
    ${profile.adjusted_mmr},
    ${profile.name_locked},
    ${profile.theme}
  )
  ON CONFLICT (
    steam_id
  ) DO UPDATE SET (
    name,
    faceit_name,
    discord_name,
    adjusted_mmr,
    name_locked,
    theme
  ) = (
    ${profile.name},
    ${profile.faceit_name},
    ${profile.discord_name},
    ${profile.adjusted_mmr},
    ${profile.name_locked},
    ${profile.theme}
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
