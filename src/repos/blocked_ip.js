var sql = require('pg-sql').sql

function deleteBlockedIP(db, id) {
  var query = sql`
  DELETE FROM
    blocked_ip
  WHERE
    id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    deleteBlockedIP: deleteBlockedIP.bind(null, db)
  }
}