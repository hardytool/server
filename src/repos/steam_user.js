const sql = require('pg-sql').sql

function getSteamUsers(db) {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    steam_user.rank,
    steam_user.previous_rank
  FROM
    steam_user
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function getSteamUsersMissingMMR(db, season_id) {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    steam_user.rank,
    steam_user.previous_rank
  FROM
    steam_user
  JOIN player ON
    steam_user.steam_id = player.steam_id
  WHERE
    player.season_id = ${season_id}
  AND
    steam_user.solo_mmr = 0
  AND
    steam_user.party_mmr = 0
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function getNonPlayerSteamUsers(db, season_id, division_id) {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    steam_user.rank,
    steam_user.previous_rank
  FROM
    steam_user
  WHERE
    steam_user.steam_id NOT IN (
      SELECT
        steam_user.steam_id
      FROM
        steam_user
      JOIN player ON
        player.steam_id = steam_user.steam_id
      WHERE
        player.season_id = ${season_id}
      AND
        player.division_id = ${division_id}
    )
  ORDER BY
    steam_user.name ASC,
    steam_user.steam_id ASC
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function getSteamUser(db, steamId) {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    steam_user.rank,
    steam_user.previous_rank
  FROM
    steam_user
  WHERE
    steam_user.steam_id = ${steamId}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveSteamUser(db, user) {
  const upsert = sql`
  INSERT INTO steam_user (
    steam_id,
    name,
    avatar,
    solo_mmr,
    party_mmr,
    rank,
    previous_rank
  ) VALUES (
    ${user.steam_id},
    ${user.name},
    ${user.avatar},
    ${user.solo_mmr},
    ${user.party_mmr},
    ${user.rank},
    ${user.previous_rank}
  )
  ON CONFLICT (
    steam_id
  ) DO UPDATE SET (
    name,
    avatar,
    solo_mmr,
    party_mmr,
    rank,
    previous_rank
  ) = (
    ${user.name},
    ${user.avatar},
    ${user.solo_mmr},
    ${user.party_mmr},
    ${user.rank},
    ${user.previous_rank}
  )
  `
  return db.query(upsert)
}

function deleteSteamUser(db, id) {
  const query = sql`
  DELETE FROM
    steam_user
  WHERE
    steam_id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getSteamUsers: getSteamUsers.bind(null, db),
    getSteamUsersMissingMMR: getSteamUsersMissingMMR.bind(null, db),
    getNonPlayerSteamUsers: getNonPlayerSteamUsers.bind(null, db),
    getSteamUser: getSteamUser.bind(null, db),
    saveSteamUser: saveSteamUser.bind(null, db),
    deleteSteamUser: deleteSteamUser.bind(null, db)
  }
}
