var sql = require('pg-sql').sql

function getUnassignedPlayers(db, season_id) {
  var select = sql`
  SELECT
    player.id,
    steam_user.steam_id,
    steam_user.avatar,
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE GREATEST(steam_user.solo_mmr, steam_user.party_mmr)
    END AS adjusted_mmr
  FROM
    player
  JOIN steam_user ON
    player.steam_id = steam_user.steam_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  WHERE
    player.id NOT IN (
      SELECT
        team_player.player_id
      FROM
        team_player
    )
  AND
    player.season_id = ${season_id}
  ORDER BY
    steam_user.name ASC,
    steam_user.steam_id ASC
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
    team_player.is_captain,
    season.name AS season_name
  FROM
    steam_user
  JOIN player ON
    steam_user.steam_id = player.steam_id
  JOIN team_player ON
    player.id = team_player.player_id
  JOIN team ON
    team_player.team_id = team.id
  JOIN season ON
    season.id = team.season_id
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
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE GREATEST(steam_user.solo_mmr, steam_user.party_mmr)
    END AS adjusted_mmr,
    team_player.is_captain
  FROM
    team
  JOIN team_player ON
    team.id = team_player.team_id
  JOIN player ON
    team_player.player_id = player.id
  JOIN steam_user ON
    player.steam_id = steam_user.steam_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
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

function isCaptainAutoApproved(db, steam_id) {
  var select = sql`
  SELECT
    NOT disbanded AND captained AS allowed
  FROM (
    SELECT
      COUNT(CASE WHEN team.disbanded = true THEN 1 END) > 0 AS disbanded,
      COUNT(1) > 0 AS captained
    FROM
      player
    JOIN team_player ON
      player.id = team_player.player_id
    JOIN team ON
      team_player.team_id = team.id
    JOIN season ON
      team.season_id = season.id
    WHERE
      player.steam_id = ${steam_id}
    AND
      team_player.is_captain = true
  ) can_captain
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function hasPlayed(db, steam_id) {
  var select = sql`
  SELECT
    COUNT(1) > 0 AS has_played
  FROM
    team_player
  JOIN player ON
    team_player.player_id = player.id
  WHERE
    player.steam_id = ${steam_id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

module.exports = db => {
  return {
    getUnassignedPlayers: getUnassignedPlayers.bind(null, db),
    addPlayerToTeam: addPlayerToTeam.bind(null, db),
    removePlayerFromTeam: removePlayerFromTeam.bind(null, db),
    getPlayerTeams: getPlayerTeams.bind(null, db),
    getRoster: getRoster.bind(null, db),
    isCaptainAutoApproved: isCaptainAutoApproved.bind(null, db),
    hasPlayed: hasPlayed.bind(null, db)
  }
}
