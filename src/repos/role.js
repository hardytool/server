var sql = require('pg-sql').sql

function saveRole(db, role) {
  var upsert = sql`
  INSERT INTO role (
    id,
    name
  ) VALUES (
    ${role.id},
    ${role.name}
  ) ON CONFLICT (
    id
  ) DO UPDATE SET
    name = ${role.name}
  `
  return db.query(upsert)
}

function getRoles(db, criteria) {
  var select = sql`
  SELECT
    role.id,
    role.name
  FROM
    role
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.role_id) {
      select = sql.join([select, sql`
      AND
        role.id = ${criteria.role_id}
      `])
    }
  }
  return db.query(select).then(result => {
    return result.rows
  })
}

function deleteRole(db, role_id) {
  var query = sql`
  DELETE FROM
    role
  WHERE
    role.id = ${role_id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    saveRole: saveRole.bind(null, db),
    deleteRole: deleteRole.bind(null, db),
    getRoles: getRoles.bind(null, db)
  }
}
