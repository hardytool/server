var sql = require('pg-sql').sql

function getDivisions(db, criteria) {
  var select = sql`
  SELECT
    division.id,
    division.name,
    division.active,
    division.discord_url,
    division.start_time,
    division.draft_sheet
  FROM
    division
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.active !== undefined) {
      select = sql.join([select, sql`
      AND
        division.active = ${criteria.active}
      `])
    }
  }
  select = sql.join([select, sql`
  ORDER BY
    name ASC
  `])
  return db.query(select).then(result => {
    return result.rows
  })
}

function getDivision(db, id) {
  var select = sql`
  SELECT
    division.id,
    division.name,
    division.active,
    division.discord_url,
    division.start_time,
    division.draft_sheet
  FROM
    division
  WHERE
    division.id = ${id}
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
      name,
      active,
      discord_url,
      start_time,
      draft_sheet
    ) VALUES (
      ${division.id},
      ${division.name},
      ${division.active},
      ${division.discord_url},
      ${division.start_time},
      ${division.draft_sheet}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      name,
      active,
      discord_url,
      start_time,
      draft_sheet
    ) = (
      ${division.name},
      ${division.active},
      ${division.discord_url},
      ${division.start_time},
      ${division.draft_sheet}
    )
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
