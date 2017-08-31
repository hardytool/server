var sql = require('pg-sql').sql

function getSeasons(db) {
  var select = sql`
  SELECT
    id,
    number,
    name,
    active,
    current_round,
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
  var select = sql`
  SELECT
    id,
    number,
    name,
    active,
    current_round,
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
  var select = sql`
  SELECT
    id,
    number,
    name,
    active,
    current_round,
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
  var upsert = sql`
  INSERT INTO
    season (
      id,
      number,
      name,
      active,
      current_round,
    registration_open
    ) VALUES (
      ${season.id},
      ${season.number},
      ${season.name},
      ${season.active},
      ${season.current_round},
      ${season.registration_open}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      number,
      name,
      active,
      current_round,
      registration_open
    ) = (
      ${season.number},
      ${season.name},
      ${season.active},
      ${season.current_round},
      ${season.registration_open}
    )
  `
  return db.query(upsert)
}

function deleteSeason(db, id) {
  var query = sql`
  DELETE FROM
    season
  WHERE
    id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getSeasons: getSeasons.bind(null, db),
    getSeason: getSeason.bind(null, db),
    getActiveSeason: getActiveSeason.bind(null, db),
    saveSeason: saveSeason.bind(null, db),
    deleteSeason: deleteSeason.bind(null, db)
  }
}
