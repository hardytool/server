var sql = require('pg-sql').sql

function getSeasons(db) {
  var select = sql`
  SELECT
    id,
    number,
    name
  FROM
    season
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
    name
  FROM
    season
  WHERE
    id = ${id}
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
      name
    ) VALUES (
      ${season.id},
      ${season.number},
      ${season.name}
    ) ON CONFLICT (
      number
    ) DO UPDATE SET (
      name
    ) = (
      ${season.name}
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
    saveSeason: saveSeason.bind(null, db),
    deleteSeason: deleteSeason.bind(null, db)
  }
}
