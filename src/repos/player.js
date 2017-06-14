var sql = require('pg-sql').sql

function getPlayers(db, criteria) {
  var select = sql`
  SELECT
    player.id,
    player.season_id,
    player.steam_id,
    player.will_captain,
    player.captain_approved,
    season.number season_number,
    season.name season_name,
    steam_user.name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    GREATEST(steam_user.solo_mmr, steam_user.party_mmr) adjusted_mmr
  FROM
    player
  JOIN steam_user ON
    steam_user.steam_id = player.steam_id
  JOIN season ON
    season.id = player.season_id
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.season_id) {
      select = sql.join([select, sql`
      AND
        player.season_id = ${criteria.season_id}
      `])
    }
    if (criteria.will_captain) {
      select = sql.join([select, sql`
      AND
        player.will_captain = ${criteria.will_captain}
      `])
    }
    if (criteria.captain_approved !== undefined) {
      select = sql.join([select, sql`
      AND
        player.captain_approved = ${criteria.captain_approved}
      `])
    }
  }
  select = sql.join([select, sql`
  ORDER BY
    adjusted_mmr DESC,
    solo_mmr DESC,
    party_mmr DESC,
    name ASC
  `])
  return db.query(select).then(result => {
    return result.rows
  })
}

function getPlayer(db, id) {
  var select = sql`
  SELECT
    player.id,
    player.season_id,
    player.steam_id,
    player.will_captain,
    player.captain_approved,
    season.number season_number,
    season.name season_name,
    steam_user.name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    GREATEST(steam_user.solo_mmr, steam_user.party_mmr) adjusted_mmr
  FROM
    player
  JOIN steam_user ON
    steam_user.steam_id = player.steam_id
  JOIN season ON
    season.id = player.season_id
  WHERE
    player.id = ${id}
  ORDER BY
    adjusted_mmr DESC,
    solo_mmr DESC,
    party_mmr DESC,
    name ASC
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function savePlayer(db, player) {
  var upsert = sql`
  INSERT INTO
    player (
      id,
      season_id,
      steam_id,
      will_captain,
      captain_approved
    ) VALUES (
      ${player.id},
      ${player.season_id},
      ${player.steam_id},
      ${player.will_captain},
      ${player.captain_approved}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      season_id,
      will_captain,
      captain_approved
    ) = (
      ${player.season_id},
      ${player.will_captain},
      ${player.captain_approved}
    )
  `
  return db.query(upsert)
}

function deletePlayer(db, id) {
  var query = sql`
  DELETE FROM
    player
  WHERE
    id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getPlayers: getPlayers.bind(null, db),
    getPlayer: getPlayer.bind(null, db),
    savePlayer: savePlayer.bind(null, db),
    deletePlayer: deletePlayer.bind(null, db)
  }
}
