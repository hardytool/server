var sql = require('pg-sql').sql

function getSeries(db, criteria) {
  var select = sql`
  SELECT
    series.id,
    series.serial,
    series.season_id,
    series.home_team_id,
    series.away_team_id,
    series.home_points,
    series.away_points,
    series.match_1_id,
    series.match_2_id,
    series.match_1_forfeit_home,
    series.match_2_forfeit_home,
    home_team.name as home_team_name,
    away_team.name as away_team_name,
    home_team.logo as home_team_logo,
    away_team.logo as away_team_logo
  FROM
    series
  JOIN
    team AS home_team
  ON
    home_team.id = series.home_team_id
  JOIN
    team AS away_team
  ON
    away_team.id = series.away_team_id
  JOIN
    season
  ON
    season.id = series.season_id
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.season_id) {
      select = sql.join([select, sql`
      AND
        series.season_id = ${criteria.season_id}
      `])
      if (criteria.serial) {
        select = sql.join([select, sql`
        AND
          series.serial < ${criteria.serial}
        `])
      }
    } else if (criteria.series_id) {
      select = sql.join([select, sql`
      AND
        series.id = ${criteria.series_id}
      `])
    }
  }
  return db.query(select).then(result => {
    return result.rows
  })
}

function saveSeries(db, series) {
  var upsert = sql`
  INSERT INTO
    series (
      id,
      serial,
      season_id,
      home_team_id,
      away_team_id,
      home_points,
      away_points,
      match_1_id,
      match_2_id,
      match_1_forfeit_home,
      match_2_forfeit_home
    ) VALUES (
      ${series.id},
      ${series.serial},
      ${series.season_id},
      ${series.home_team_id},
      ${series.away_team_id},
      ${series.home_points},
      ${series.away_points},
      ${series.match_1_id},
      ${series.match_2_id},
      ${series.match_1_forfeit_home},
      ${series.match_2_forfeit_home}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      serial,
      season_id,
      home_team_id,
      away_team_id,
      home_points,
      away_points,
      match_1_id,
      match_2_id,
      match_1_forfeit_home,
      match_2_forfeit_home
    ) = (
      ${series.serial},
      ${series.season_id},
      ${series.home_team_id},
      ${series.away_team_id},
      ${series.home_points},
      ${series.away_points},
      ${series.match_1_id},
      ${series.match_2_id},
      ${series.match_1_forfeit_home},
      ${series.match_2_forfeit_home}
    )
  `
  return db.query(upsert)
}

function deleteSeries(db, id) {
  var query = sql`
  DELETE FROM
    series
  WHERE
    id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getSeries: getSeries.bind(null, db),
    saveSeries: saveSeries.bind(null, db),
    deleteSeries: deleteSeries.bind(null, db)
  }
}
