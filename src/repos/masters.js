const sql = require('pg-sql').sql

// seasons
function getSeasons(db, direction = 'ASC') {
  const select = `
    SELECT
      id,
      number,
      active,
      registration_open
    FROM
      masters_season
    ORDER BY
      number ${direction};
    `

  return db.query(select).then(result => {
    return result.rows
  })
}

function getSeason(db, id) {
  const select = sql`
  SELECT
    id,
    number,
    active,
    registration_open
  FROM
    masters_season
  WHERE
    id = ${id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function getActiveSeason(db) {
  const select = sql`
  SELECT
    id,
    number,
    active,
    registration_open
  FROM
    masters_season
  WHERE
    active = TRUE
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveSeason(db, season) {
  const upsert = sql`
  INSERT INTO
    masters_season (
      id,
      number,
      active,
      registration_open
    ) VALUES (
      ${season.id},
      ${season.number},
      ${season.active},
      ${season.registration_open}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      number,
      active,
      registration_open
    ) = (
      ${season.number},
      ${season.active},
      ${season.registration_open}
    )
  `
  return db.query(upsert)
}

function deleteSeason(db, id) {
  const query = sql`
  DELETE FROM
    masters_season
  WHERE
    id = ${id}
  `
  return db.query(query)
}


// divisions
function getDivisions(db) {
  const select = sql`
  SELECT
    id,
    name
  FROM
    masters_division
  ORDER BY
    name ASC
  `

  return db.query(select).then(result => {
    return result.rows
  })
}

function getDivision(db, id) {
  const select = sql`
  SELECT
    id,
    name
  FROM
    masters_division
  WHERE
    id = ${id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveDivision(db, division) {
  const upsert = sql`
  INSERT INTO
    masters_division(
      id,
      name
    ) VALUES (
      ${division.id},
      ${division.name}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET name = ${division.name}
  `

  return db.query(upsert)
}

function deleteDivision(db, id) {
  const query = sql`
  DELETE FROM
    masters_division
  WHERE
    id = ${id}
  `
  return db.query(query)
}


// teams
function getTeams(db, season_id, division_id) {
  let select = sql`
  SELECT
    masters_team.id,
    masters_team.season_id,
    masters_team.division_id,
    masters_team.name,
    masters_team.logo,
    masters_team.scheduler_discord_id,
    masters_team.approved,
    masters_team.group_number,
    masters_team.disbanded,
    masters_season.number AS season_number,
    masters_division.name AS division_name
  FROM
    masters_team
  JOIN masters_season ON
    masters_season.id = masters_team.season_id
  JOIN masters_division ON
    masters_division.id = masters_team.division_id
  WHERE
    masters_team.season_id = ${season_id}
  `

  if (division_id) {
    select = sql.join([select, sql`
      AND masters_team.division_id = ${division_id}
    `])
  }

  select = sql.join([select, sql`
    ORDER BY masters_team.group_number ASC, masters_team.name ASC
  `])

  return db.query(select).then(result => {
    return result.rows
  })
}

function getTeam(db, id) {
  const select = sql`
  SELECT
    id,
    season_id,
    division_id,
    name,
    logo,
    scheduler_discord_id,
    approved,
    disbanded
  FROM
    masters_team
  WHERE
    id = ${id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveTeam(db, team) {
  const upsert = sql`
  INSERT INTO
    masters_team (
      id,
      season_id,
      division_id,
      name,
      logo,
      scheduler_discord_id,
      approved,
      disbanded
    ) VALUES (
      ${team.id},
      ${team.season_id},
      ${team.division_id},
      ${team.name},
      ${team.logo},
      ${team.scheduler_discord_id},
      ${team.approved},
      ${team.disbanded}
    ) ON CONFLICT ON CONSTRAINT masters_team_pkey
    DO UPDATE SET (
      season_id,
      division_id,
      name,
      logo,
      scheduler_discord_id,
      approved,
      disbanded
    ) = (
      ${team.season_id},
      ${team.division_id},
      ${team.name},
      ${team.logo},
      ${team.scheduler_discord_id},
      ${team.approved},
      ${team.disbanded}
    )
    RETURNING id, season_id, division_id, name, logo, scheduler_discord_id, approved, disbanded
  `
  return db.query(upsert).then(result => {
    return result.rows[0]
  })
}

function deleteTeam(db, id) {
  const query = sql`
  DELETE FROM
    masters_team
  WHERE
    id = ${id}
  `
  return db.query(query)
}


// team players / rosters
function addPlayerToTeam(db, team_id, player_id, position) {
  const upsert = sql`
  INSERT INTO masters_team_player (
    team_id,
    player_id,
    position
  ) VALUES (
    ${team_id},
    ${player_id},
    ${position}
  ) ON CONFLICT ON CONSTRAINT masters_team_player_team_id_player_id_key
  DO UPDATE SET (
    team_id,
    position
  ) = (
    ${team_id},
    ${position}
  )
  `
  return db.query(upsert)
}

function removePlayerFromTeam(db, team_id, player_id) {
  const query = sql`
  DELETE FROM
    masters_team_player
  WHERE
    team_id = ${team_id}
    AND player_id = ${player_id}
  `
  return db.query(query)
}

function getPlayerTeams(db, steam_id, season_id, division_id) {
  let select = sql`
  SELECT
    masters_team.id,
    masters_team.season_id,
    masters_team.division_id,
    masters_team.name,
    masters_team.logo,
    masters_team_player.position,
    masters_season.number AS season_number,
    masters_division.name AS division_name
  FROM masters_player
  JOIN masters_team_player ON masters_player.id = masters_team_player.player_id
  JOIN masters_team ON masters_team_player.team_id = masters_team.id
  JOIN masters_season ON masters_season.id = masters_team.season_id
  JOIN masters_division ON masters_division.id = masters_team.division_id
  WHERE
    1=1
  `
  if (steam_id) {
    select = sql.join([select, sql`
      AND masters_player.steam_id = ${steam_id}
    `])
  }
  if (season_id) {
    select = sql.join([select, sql`
      AND masters_team.season_id = ${season_id}
    `])
  }
  if (division_id) {
    select = sql.join([select, sql`
      AND masters_team.division_id = ${division_id}
      AND masters_player.division_id = ${division_id}
    `])
  }
  select = sql.join([select, sql`
  ORDER BY masters_division.name ASC, masters_season.number ASC
  `])

  return db.query(select).then(result => {
    return result.rows
  })
}

function getRoster(db, team_id) {
  const select = sql`
  SELECT
    masters_player.id,
    steam_user.steam_id,
    steam_user.name AS name,
    steam_user.avatar,
    steam_user.rank,
    masters_team_player.position,
    masters_player.mmr_screenshot
  FROM masters_team
  JOIN masters_team_player ON masters_team.id = masters_team_player.team_id
  JOIN masters_player ON masters_team_player.player_id = masters_player.id
  JOIN steam_user ON masters_player.steam_id = steam_user.steam_id

  WHERE masters_team.id = ${team_id}
  ORDER BY masters_team_player.position ASC
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function getPlayer(db, steam_id) {
  const select = sql`
  SELECT
    id,
    steam_id,
    discord_id
  FROM
    masters_player
  WHERE
    steam_id = ${steam_id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function savePlayer(db, player) {
  const upsert = sql`
  INSERT INTO
    masters_player (
      id,
      steam_id,
      discord_id,
      mmr_screenshot
    ) VALUES (
      ${player.id},
      ${player.steam_id},
      ${player.discord_id},
      ${player.mmr_screenshot}
    ) ON CONFLICT (
      steam_id
    ) DO UPDATE SET (
      discord_id,
      mmr_screenshot
    ) = (
      ${player.discord_id},
      ${player.mmr_screenshot}
    )
    RETURNING id
  `
  return db.query(upsert).then(result => {
    return result.rows[0]
  })
}


// series
function getSeries(db, criteria) {
  let select = sql`
  SELECT
    masters_series.id,
    masters_series.season_id,
    masters_series.home_team_id,
    masters_series.away_team_id,
    masters_series.home_points,
    masters_series.away_points,
    masters_series.round,
    masters_series.match_1_url,
    masters_series.match_2_url,
    masters_series.match_1_forfeit_home,
    masters_series.match_2_forfeit_home,
    home_team.name as home_team_name,
    away_team.name as away_team_name,
    home_team.logo as home_team_logo,
    away_team.logo as away_team_logo,
    home_team.scheduler_discord_id as home_team_scheduler_discord_id,
    away_team.scheduler_discord_id as away_team_scheduler_discord_id,
    home_team.division_id as home_team_division_id,
    away_team.division_id as away_team_division_id,
    home_team.group_number as group_number
  FROM masters_series
  FULL OUTER JOIN masters_team AS home_team ON home_team.id = masters_series.home_team_id
  FULL OUTER JOIN masters_team AS away_team ON away_team.id = masters_series.away_team_id
  JOIN masters_season ON masters_season.id = masters_series.season_id
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.season_id) {
      select = sql.join([select, sql`
      AND masters_series.season_id = ${criteria.season_id}
      `])
    }
    if (criteria.division_id) {
      select = sql.join([select, sql`
        AND (
          home_team.division_id = ${criteria.division_id}
          OR
          away_team.division_id = ${criteria.division_id}
        )`
      ])
    }
    if (criteria.round) {
      select = sql.join([select, sql`
      AND masters_series.round < ${criteria.round}
      `])
    }
    if (criteria.series_id) {
      select = sql.join([select, sql`
      AND masters_series.id = ${criteria.series_id}
      `])
    }
    if (criteria.team_id) {
      select = sql.join([select, sql`
      AND (
        masters_series.home_team_id = ${criteria.team_id}
        OR
        masters_series.away_team_id = ${criteria.team_id}
      )
      `])
    }
  }

  select = sql.join([select, sql`
    ORDER BY masters_series.round DESC, home_team.group_number ASC
    `
  ])

  return db.query(select).then(result => {
    return result.rows
  })
}

function saveSeries(db, series) {
  const upsert = sql`
  INSERT INTO
    masters_series (
      id,
      round,
      season_id,
      division_id,
      home_team_id,
      away_team_id,
      home_points,
      away_points,
      match_1_url,
      match_2_url,
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
      ${series.match_1_url},
      ${series.match_2_url},
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
      match_1_url,
      match_2_url,
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
      ${series.match_1_url},
      ${series.match_2_url},
      ${series.match_1_forfeit_home},
      ${series.match_2_forfeit_home}
    )
  `
  return db.query(upsert)
}

function deleteSeries(db, id) {
  const query = sql`
  DELETE FROM
    masters_series
  WHERE
    id = ${id}
  `
  return db.query(query)
}

function getStandings(db, season_id, division_id) {
  const query = sql`
  SELECT
    masters_team.id,
    masters_team.name,
    masters_team.logo,
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
        masters_series
      WHERE
        season_id = ${season_id}
        AND division_id = ${division_id}
      UNION ALL
      SELECT
        season_id,
        division_id,
        away_team_id team_id,
        away_points win,
        home_points loss
      FROM
        masters_series
      WHERE
        season_id = ${season_id}
        AND division_id = ${division_id}
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
  FULL OUTER JOIN masters_team ON masters_team.id = standings.team_id

  WHERE
    masters_team.season_id = ${season_id}
    AND masters_team.division_id = ${division_id}
  ORDER BY
    standings.wins DESC
  `
  return db.query(query).then(result => {
    return result.rows
  })
}

function getCurrentRound(db, season_id, division_id) {
  const query = sql`
  SELECT
    current_round as round
  FROM
    masters_round
  WHERE
    season_id = ${season_id}
    AND division_id = ${division_id}
  `
  return db.query(query).then(result => {
    return result.rows[0].round
  })
}

function saveCurrentRound(db, season_id, division_id, round) {
  const upsert = sql`
  INSERT INTO
    masters_round (
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

module.exports = (db) => {
  return {
    getSeasons: getSeasons.bind(null, db),
    getSeason: getSeason.bind(null, db),
    getActiveSeason: getActiveSeason.bind(null, db),
    saveSeason: saveSeason.bind(null, db),
    deleteSeason: deleteSeason.bind(null, db),

    getDivisions: getDivisions.bind(null, db),
    getDivision: getDivision.bind(null, db),
    saveDivision: saveDivision.bind(null, db),
    deleteDivision: deleteDivision.bind(null, db),

    getTeams: getTeams.bind(null, db),
    getTeam: getTeam.bind(null, db),
    saveTeam: saveTeam.bind(null, db),
    deleteTeam: deleteTeam.bind(null, db),

    addPlayerToTeam: addPlayerToTeam.bind(null, db),
    removePlayerFromTeam: removePlayerFromTeam.bind(null, db),
    getPlayerTeams: getPlayerTeams.bind(null, db),
    getRoster: getRoster.bind(null, db),
    getPlayer: getPlayer.bind(null, db),
    savePlayer: savePlayer.bind(null, db),

    getSeries: getSeries.bind(null, db),
    saveSeries: saveSeries.bind(null, db),
    deleteSeries: deleteSeries.bind(null, db),
    getStandings: getStandings.bind(null, db),
    getCurrentRound: getCurrentRound.bind(null, db),
    saveCurrentRound: saveCurrentRound.bind(null, db)
  }
}
