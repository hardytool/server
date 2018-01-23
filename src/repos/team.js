var sql = require('pg-sql').sql

function getTeams(db, season_id) {
  var select = sql`
  SELECT
    team.id,
    team.season_id,
    team.name,
    team.logo,
    team.team_number,
    team.seed,
    team.disbanded,
    steam_user.steam_id as captain_id,
    COALESCE(profile.name, steam_user.name) AS captain_name,
    season.number AS season_number,
    season.name AS season_name
  FROM
    team
  JOIN season ON
    season.id = team.season_id
  LEFT JOIN team_player ON
    team.id = team_player.team_id
  AND
    team_player.is_captain
  LEFT JOIN player ON
    team_player.player_id = player.id
  LEFT JOIN steam_user ON
    player.steam_id = steam_user.steam_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  WHERE
    team.season_id = ${season_id}
  ORDER BY
    team.name ASC,
    team.seed DESC
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function getTeam(db, id) {
  var select = sql`
  SELECT
    id,
    season_id,
    name,
    logo,
    team_number,
    seed,
    disbanded
  FROM
    team
  WHERE
    id = ${id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveTeam(db, team) {
  var upsert = sql`
  INSERT INTO
    team (
      id,
      season_id,
      name,
      logo,
      team_number,
      seed,
      disbanded
    ) VALUES (
      ${team.id},
      ${team.season_id},
      ${team.name},
      ${team.logo},
      ${team.team_number},
      ${team.seed},
      ${team.disbanded}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      season_id,
      name,
      logo,
      team_number,
      seed,
      disbanded
    ) = (
      ${team.season_id},
      ${team.name},
      ${team.logo},
      ${team.team_number},
      ${team.seed},
      ${team.disbanded}
    )
  `
  return db.query(upsert)
}

function deleteTeam(db, id) {
  var query = sql`
  DELETE FROM
    team
  WHERE
    id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getTeams: getTeams.bind(null, db),
    getTeam: getTeam.bind(null, db),
    saveTeam: saveTeam.bind(null, db),
    deleteTeam: deleteTeam.bind(null, db)
  }
}
