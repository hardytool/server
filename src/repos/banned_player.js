const sql = require('pg-sql').sql

function saveBannedPlayer(db, banned_player) {
  const upsert = sql`
  INSERT INTO banned_player (
    id,
    steam_id,
    name,
    reason,
    banned_until,
    still_banned
  ) VALUES (
    ${banned_player.id},
    ${banned_player.steam_id},
    ${banned_player.name},
    ${banned_player.reason},
    ${banned_player.banned_until},
    ${banned_player.still_banned}
  ) ON CONFLICT (
    id
  ) DO UPDATE SET
    steam_id = ${banned_player.steam_id},
    name = ${banned_player.name},
    reason = ${banned_player.reason},
    banned_until = ${banned_player.banned_until},
    still_banned = ${banned_player.still_banned}
  `
  return db.query(upsert)
}

function getBannedPlayers(db, criteria) {
  let select = sql`
  SELECT
    banned_player.id,
    banned_player.steam_id,
    banned_player.name,
    banned_player.reason,
    banned_player.banned_until,
    banned_player.still_banned
  FROM
    banned_player
  WHERE
  	1 = 1
  `

  if (criteria) {
    if (criteria.banned_player_id) {
      select = sql.join([select, sql`
      AND
        banned_player.id = ${criteria.banned_player_id}
      `])
    }
  }
  return db.query(select).then(result => {
    return result.rows
  })
}

function deleteBannedPlayer(db, banned_player_id) {
  const query = sql`
  DELETE FROM
    banned_player
  WHERE
    banned_player.id = ${banned_player_id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    saveBannedPlayer: saveBannedPlayer.bind(null, db),
    getBannedPlayers: getBannedPlayers.bind(null, db),
    deleteBannedPlayer: deleteBannedPlayer.bind(null, db)
  }
}
