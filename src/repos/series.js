const sql = require('pg-sql').sql

function getSeries(db, criteria) {
  let select = sql`
  SELECT
    series.id,
    series.round,
    series.season_id,
    series.division_id,
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
  FULL OUTER JOIN team AS home_team ON
    home_team.id = series.home_team_id
  FULL OUTER JOIN team AS away_team ON
    away_team.id = series.away_team_id
  JOIN season ON
    season.id = series.season_id
  JOIN division ON
    division.id = series.division_id
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.season_id) {
      select = sql.join([select, sql`
      AND
        series.season_id = ${criteria.season_id}
      `])
      if (criteria.round) {
        select = sql.join([select, sql`
        AND
          series.round < ${criteria.round}
        `])
      }
    }
    if (criteria.division_id) {
      select = sql.join([select, sql`
      AND
        series.division_id = ${criteria.division_id}
      `])
    }
    if (criteria.series_id) {
      select = sql.join([select, sql`
      AND
        series.id = ${criteria.series_id}
      `])
    }
    if (criteria.team_id) {
      select = sql.join([select, sql`
      AND (
        series.home_team_id = ${criteria.team_id}
        OR
        series.away_team_id = ${criteria.team_id}
      )
      `])
    }
  }
  select = sql.join([select, sql`
  ORDER BY
    series.round ASC,
    (series.home_points + series.away_points) DESC,
    (home_team.seed + away_team.seed) DESC,
    home_team.name ASC,
    away_team.name ASC,
    series.home_points DESC
  `])
  return db.query(select).then(result => {
    return result.rows
  })
}

function saveSeries(db, series) {
  const upsert = sql`
  INSERT INTO
    series (
      id,
      round,
      season_id,
      division_id,
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
      ${series.round},
      ${series.season_id},
      ${series.division_id},
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
      round,
      season_id,
      division_id,
      home_team_id,
      away_team_id,
      home_points,
      away_points,
      match_1_id,
      match_2_id,
      match_1_forfeit_home,
      match_2_forfeit_home
    ) = (
      ${series.round},
      ${series.season_id},
      ${series.division_id},
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
  const query = sql`
  DELETE FROM
    series
  WHERE
    id = ${id}
  `
  return db.query(query)
}

function getCurrentRound(db, season_id, division_id, round) {
  return Promise.resolve(round).then(round => {
    if (Number.isInteger(round)) {
      return Promise.resolve(round)
    } else {
      const query = sql`
      SELECT
        current_round as round
      FROM
        round
      WHERE
        season_id = ${season_id}
      AND
        division_id = ${division_id}
      `
      return db.query(query).then(result => {
        return result.rows[0].round
      })
    }
  })
}

function saveCurrentRound(db, season_id, division_id, round) {
  const upsert = sql`
  INSERT INTO
    round (
      season_id,
      division_id,
      current_round
    ) VALUES (
      ${season_id},
      ${division_id},
      ${round}
    ) ON CONFLICT (
      season_id,
      division_id
    ) DO UPDATE SET
      current_round = ${round}
  `
  return db.query(upsert)
}

function getStandings(db, season_id, division_id, round) {
  return getCurrentRound(db, season_id, round).then(round => {
    const query = sql`
    SELECT
      team.id,
      team.name,
      team.logo,
      team.seed,
      team.disbanded,
      steam_user.steam_id as captain_id,
      steam_user.name as captain_name,
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
          division_id,
          home_team_id team_id,
          home_points win,
          away_points loss
        FROM
          series
        WHERE
          round < ${round}
        AND
          season_id = ${season_id}
        AND
          division_id = ${division_id}
        UNION ALL
        SELECT
          season_id,
          division_id,
          away_team_id team_id,
          away_points win,
          home_points loss
        FROM
          series
        WHERE
          round < ${round}
        AND
          season_id = ${season_id}
        AND
          division_id = ${division_id}
      ) standings
      WHERE
        season_id = ${season_id}
      AND
        division_id = ${division_id}
      AND
        team_id IS NOT NULL
      GROUP BY
        team_id
    ) standings
    FULL OUTER JOIN team ON
      team.id = standings.team_id
    LEFT JOIN team_player ON
      team.id = team_player.team_id
    AND
      team_player.is_captain
    LEFT JOIN player ON
      team_player.player_id = player.id
    LEFT JOIN steam_user ON
      player.steam_id = steam_user.steam_id
    WHERE
      team.season_id = ${season_id}
    AND
      team.division_id = ${division_id}
    ORDER BY
      standings.wins DESC,
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
    getCurrentRound: getCurrentRound.bind(null, db),
    saveCurrentRound: saveCurrentRound.bind(null, db),
    getStandings: getStandings.bind(null, db)
  }
}
