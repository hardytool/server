var sql = require('pg-sql').sql

function getDivisions(db) {
  var select = sql`
  SELECT
    id,
    name
  FROM
    division
  ORDER BY
    name ASC
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function getDivision(db, id) {
  var select = sql`
  SELECT
    id,
    name
  FROM
    division
  WHERE
    id = ${id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveDivision(db, division) {
  var upsert = sql`
  INSERT INTO
    division(
      id,
      name
    ) VALUES (
      ${division.id},
      ${division.name}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET
      name
    =
      ${division.name}
  `
  return db.query(upsert)
}

function deleteDivision(db, id) {
  var query = sql`
  DELETE FROM
    division
  WHERE
    id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getDivisions: getDivisions.bind(null, db),
    getDivision: getDivision.bind(null, db),
    saveDivision: saveDivision.bind(null, db),
    deleteDivision: deleteDivision.bind(null, db)
  }
}
