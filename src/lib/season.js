var sql = require('pg-sql').sql
var shortid = require('shortid')

function getSeasonList(db) {
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
      ${shortid.generate()},
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

module.exports = db => {
  return {
    getSeasonList: getSeasonList.bind(null, db),
    getSeason: getSeason.bind(null, db),
    saveSeason: saveSeason.bind(null, db)
  }
}
