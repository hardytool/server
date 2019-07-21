const sql = require('pg-sql').sql

function getPlayoffSeries(db, season_id, division_id, series_id = null) {
  let select = sql`
  SELECT
    playoff_series.id,
    playoff_series.round,
    playoff_series.season_id,
    playoff_series.division_id,
    playoff_series.home_team_id,
    playoff_series.away_team_id,
    playoff_series.home_points,
    playoff_series.away_points,
    playoff_series.match_url,
    playoff_series.match_number,
    playoff_series.match_time,
    home_team.name as home_team_name,
    away_team.name as away_team_name,
    home_team.logo as home_team_logo,
    away_team.logo as away_team_logo
  FROM
    playoff_series
  FULL OUTER JOIN team AS home_team ON
    home_team.id = playoff_series.home_team_id
  FULL OUTER JOIN team AS away_team ON
    away_team.id = playoff_series.away_team_id
  JOIN season ON
    season.id = playoff_series.season_id
  JOIN division ON
    division.id = playoff_series.division_id
  WHERE
    playoff_series.season_id = ${season_id}
    AND playoff_series.division_id = ${division_id}
  `
  if (series_id) {
    select = sql.join([select, sql`
      AND playoff_series.id = ${series_id}
    `]);
  }

  select = sql.join([select, sql`
    ORDER BY playoff_series.match_number
  `]);

  return db.query(select).then(result => {
    return result.rows
  })
}

function savePlayoffSeries(db, playoffSeries) {

  if (!playoffSeries.home_points) {
    playoffSeries.home_points = null;
  }
  if (!playoffSeries.away_points) {
    playoffSeries.away_points = null;
  }
  if (!playoffSeries.match_url) {
    playoffSeries.match_url = null;
  }
  if (!playoffSeries.match_time) {
    playoffSeries.match_time = null;
  }

  const upsert = sql`
  INSERT INTO
    playoff_series (
      id,
      round,
      season_id,
      division_id,
      home_team_id,
      away_team_id,
      home_points,
      away_points,
      match_url,
      match_number,
      match_time
    ) VALUES (
      ${playoffSeries.id},
      ${playoffSeries.round},
      ${playoffSeries.season_id},
      ${playoffSeries.division_id},
      ${playoffSeries.home_team_id},
      ${playoffSeries.away_team_id},
      ${playoffSeries.home_points},
      ${playoffSeries.away_points},
      ${playoffSeries.match_url},
      ${playoffSeries.match_number},
      ${playoffSeries.match_time}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      round,
      season_id,
      division_id,
      home_team_id,
      away_team_id,
      home_points,
      away_points,
      match_url,
      match_number,
      match_time
    ) = (
      ${playoffSeries.round},
      ${playoffSeries.season_id},
      ${playoffSeries.division_id},
      ${playoffSeries.home_team_id},
      ${playoffSeries.away_team_id},
      ${playoffSeries.home_points},
      ${playoffSeries.away_points},
      ${playoffSeries.match_url},
      ${playoffSeries.match_number},
      ${playoffSeries.match_time}
    )
  `
  return db.query(upsert)
}

function deletePlayoffSeries(db, id) {
  const query = sql`
  DELETE FROM
    playoff_series
  WHERE
    id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getPlayoffSeries: getPlayoffSeries.bind(null, db),
    savePlayoffSeries: savePlayoffSeries.bind(null, db),
    deletePlayoffSeries: deletePlayoffSeries.bind(null, db),
  }
}
