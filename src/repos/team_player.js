var sql = require('pg-sql').sql

function getUnassignedPlayers(db, season_id) {
  var select = sql`
  SELECT
    player.id,
    steam_user.steam_id,
    steam_user.avatar,
    steam_user.name,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    GREATEST(steam_user.solo_mmr, steam_user.party_mmr) adjusted_mmr
  FROM
    player
  JOIN steam_user ON
    player.steam_id = steam_user.steam_id
  WHERE
    player.id NOT IN (
      SELECT
        team_player.player_id
      FROM
        team_player
    )
  AND
    player.season_id = ${season_id}
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function addPlayerToTeam(db, team_id, player_id, is_captain) {
  var upsert = sql`
  INSERT INTO team_player (
    team_id,
    player_id,
    is_captain
  ) VALUES (
    ${team_id},
    ${player_id},
    ${is_captain}
  ) ON CONFLICT (
    player_id
  ) DO UPDATE SET (
    team_id,
    is_captain
  ) = (
    ${team_id},
    ${is_captain}
  )
  `
  return db.query(upsert)
}

function removePlayerFromTeam(db, team_id, player_id) {
  var query = sql`
  DELETE FROM
    team_player
  WHERE
    team_id = ${team_id}
  AND
    player_id = ${player_id}
  `
  return db.query(query)
}

function getPlayerTeams(db, steam_id, season_id) {
  var select = sql`
  SELECT
    team.id,
    team.season_id,
    team.name,
    team.logo,
    team.seed,
    team_player.is_captain
  FROM
    steam_user
  JOIN player ON
    steam_user.steam_id = player.steam_id
  JOIN team_player ON
    player.id = team_player.player_id
  JOIN team ON
    team_player.team_id = team.id
  WHERE
    steam_user.steam_id = ${steam_id}
  `
  if (season_id) {
    select = sql.join([select, sql`
    AND
      team.season_id = ${season_id}
    AND
      player.season_id = ${season_id}
    `])
  }
  return db.query(select).then(result => {
    return result.rows
  })
}

function getRoster(db, team_id) {
  var select = sql`
  SELECT
    player.id,
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    GREATEST(steam_user.solo_mmr, steam_user.party_mmr) adjusted_mmr,
    team_player.is_captain
  FROM
    team
  JOIN team_player ON
    team.id = team_player.team_id
  JOIN player ON
    team_player.player_id = player.id
  JOIN steam_user ON
    player.steam_id = steam_user.steam_id
  WHERE
    team.id = ${team_id}
  ORDER BY
    adjusted_mmr DESC,
    steam_user.solo_mmr DESC,
    steam_user.party_mmr DESC,
    steam_user.name ASC
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

module.exports = db => {
  return {
    getUnassignedPlayers: getUnassignedPlayers.bind(null, db),
    addPlayerToTeam: addPlayerToTeam.bind(null, db),
    removePlayerFromTeam: removePlayerFromTeam.bind(null, db),
    getPlayerTeams: getPlayerTeams.bind(null, db),
    getRoster: getRoster.bind(null, db)
  }
}
