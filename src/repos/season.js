const sql = require('pg-sql').sql

function getSeasons(db) {
  const select = sql`
  SELECT
    id,
    number,
    name,
    active,
    activity_check,
    registration_open
  FROM
    season
  ORDER BY
    number ASC
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
    name,
    active,
    activity_check,
    registration_open
  FROM
    season
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
    name,
    active,
    activity_check,
    registration_open
  FROM
    season
  WHERE
    active
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveSeason(db, season) {
  const upsert = sql`
  INSERT INTO
    season (
      id,
      number,
      name,
      active,
      activity_check,
      registration_open
    ) VALUES (
      ${season.id},
      ${season.number},
      ${season.name},
      ${season.active},
      ${season.activity_check},
      ${season.registration_open}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      number,
      name,
      active,
      activity_check,
      registration_open
    ) = (
      ${season.number},
      ${season.name},
      ${season.active},
      ${season.activity_check},
      ${season.registration_open}
    )
  `
  return db.query(upsert)
}

function deleteSeason(db, id) {
  const query = sql`
  DELETE FROM
    season
  WHERE
    id = ${id}
  `
  return db.query(query)
}

function startSeason(db, divisionIds, seasonId) {
  const query = sql`
  INSERT INTO round(season_id, current_round, division_id)
  values(${seasonId}, 0, unnest(${divisionIds}::text[]))
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getSeasons: getSeasons.bind(null, db),
    getSeason: getSeason.bind(null, db),
    getActiveSeason: getActiveSeason.bind(null, db),
    saveSeason: saveSeason.bind(null, db),
    deleteSeason: deleteSeason.bind(null, db),
    startSeason: startSeason.bind(null, db)
  }
}
