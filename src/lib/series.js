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
  FULL OUTER JOIN
    team AS home_team
  ON
    home_team.id = series.home_team_id
  FULL OUTER JOIN
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

function getNextSerial(db, season_id, serial) {
  return Promise.resolve(serial).then(serial => {
    if (serial) {
      return Promise.resolve(serial)
    } else {
      var query = sql`
      SELECT
        COALESCE(MAX(serial), 0) + 1 as serial
      FROM
        series
      WHERE
        season_id = ${season_id}
      `
      return db.query(query).then(result => {
        return result.rows[0].serial
      })
    }
  })
}

function getStandings(db, season_id, serial) {
  return getNextSerial(db, season_id, serial).then(serial => {
    var query = sql`
    SELECT
      team.id,
      team.name,
      team.logo,
      team.seed,
      COALESCE(standings.wins, 0) as wins,
      COALESCE(standings.losses, 0) as losses
    FROM (
      SELECT
        team_id,
        SUM(standings.win) wins,
        SUM(standings.loss) losses
      FROM (
        SELECT
          season_id,
          home_team_id team_id,
          home_points win,
          away_points loss
        FROM
          series
        WHERE
          serial < ${serial}
        UNION ALL
        SELECT
          season_id,
          away_team_id team_id,
          away_points win,
          home_points loss
        FROM
          series
        WHERE
          serial < ${serial}
      ) standings
      WHERE
        season_id = ${season_id}
      GROUP BY
        team_id
    ) standings
    FULL OUTER JOIN
      team
    ON
      team.id = standings.team_id
    ORDER BY
      (2 * standings.wins) DESC,
      (2 * standings.wins - standings.losses) DESC,
      team.seed DESC
    `
    return db.query(query).then(result => {
      return result.rows
    })
  })
}

module.exports = db => {
  return {
    getSeries: getSeries.bind(null, db),
    saveSeries: saveSeries.bind(null, db),
    deleteSeries: deleteSeries.bind(null, db),
    getNextSerial: getNextSerial.bind(null, db),
    getStandings: getStandings.bind(null, db)
  }
}
