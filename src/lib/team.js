var sql = require('pg-sql').sql

function getTeams(db, season_id) {
  var select = sql`
  SELECT
    team.id,
    team.season_id,
    team.name,
    team.logo,
    team.seed,
    season.number AS season_number,
    season.name AS season_name
  FROM
    team
  JOIN
    season
  ON
    season.id = team.season_id
  WHERE
    team.season_id = ${season_id}
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
    seed
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
      seed
    ) VALUES (
      ${team.id},
      ${team.season_id},
      ${team.name},
      ${team.logo},
      ${team.seed}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      season_id,
      name,
      logo,
      seed
    ) = (
      ${team.season_id},
      ${team.name},
      ${team.logo},
      ${team.seed}
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
