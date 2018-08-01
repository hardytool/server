var sql = require('pg-sql').sql

function getTeams(db, season_id, division_id) {
  var select = sql`
  SELECT
    team.id,
    team.season_id,
    team.division_id,
    team.name,
    team.logo,
    team.team_number,
    team.seed,
    team.disbanded,
    team.standin_count,
    steam_user.steam_id as captain_id,
    COALESCE(profile.name, steam_user.name) AS captain_name,
    season.number AS season_number,
    season.name AS season_name,
    division.name AS division_name
  FROM
    team
  JOIN season ON
    season.id = team.season_id
  JOIN division ON
    division.id = team.division_id
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
  AND
    team.division_id = ${division_id}
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
    division_id,
    name,
    logo,
    team_number,
    seed,
    disbanded,
    standin_count
  FROM
    team
  WHERE
    id = ${id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function getAllSeasonTeams(db, season_id) {
    var select = sql`
      SELECT
        team.id,
        team.season_id,
        team.division_id,
        team.name,
        team.logo,
        team.team_number,
        team.seed,
        team.disbanded,
        team.standin_count,
        steam_user.steam_id as captain_id,
        COALESCE(profile.name, steam_user.name) AS captain_name,
        season.number AS season_number,
        season.name AS season_name,
        division.name AS division_name
      FROM
        team
      JOIN season ON
        season.id = team.season_id
      JOIN division ON
        division.id = team.division_id
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

function saveTeam(db, team) {
  var upsert = sql`
  INSERT INTO
    team (
      id,
      season_id,
      division_id,
      name,
      logo,
      team_number,
      seed,
      disbanded,
      standin_count
    ) VALUES (
      ${team.id},
      ${team.season_id},
      ${team.division_id},
      ${team.name},
      ${team.logo},
      ${team.team_number},
      ${team.seed},
      ${team.disbanded},
      ${team.standin_count}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      season_id,
      division_id,
      name,
      logo,
      team_number,
      seed,
      disbanded,
      standin_count
    ) = (
      ${team.season_id},
      ${team.division_id},
      ${team.name},
      ${team.logo},
      ${team.team_number},
      ${team.seed},
      ${team.disbanded},
      ${team.standin_count}
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
    getAllSeasonTeams: getAllSeasonTeams.bind(null, db),
    saveTeam: saveTeam.bind(null, db),
    deleteTeam: deleteTeam.bind(null, db)
  }
}
