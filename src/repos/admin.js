var sql = require('pg-sql').sql

function isAdmin(db, id) {
  var select = sql`
  SELECT
    COUNT(*) > 0 AS is_admin
  FROM
    admin
  WHERE
    steam_id = ${id.toString()}
  `
  return db.query(select).then(result => {
    return result.rows[0].is_admin
  })
}

module.exports = db => {
  return {
    isAdmin: isAdmin.bind(null, db)
  }
}
