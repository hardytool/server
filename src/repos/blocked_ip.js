var sql = require('pg-sql').sql

function getBlockedIPs(db, criteria) {
  var select = sql`
  SELECT
    blocked_ip.id,
    blocked_ip.address
  FROM
    blocked_ip
  WHERE
    1 = 1
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function saveBlockedIP(db, blocked_ip) {
  var upsert = sql`
  INSERT INTO blocked_ip (
    id,
    address
  ) VALUES (
    ${blocked_ip.id},
    ${blocked_ip.address}
  ) ON CONFLICT (
    id
  ) DO UPDATE SET
    address = ${blocked_ip.address}
  `
  return db.query(upsert)
}

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
    getBlockedIPs: getBlockedIPs.bind(null, db),
    saveBlockedIP: saveBlockedIP.bind(null, db),
    deleteBlockedIP: deleteBlockedIP.bind(null, db)
  }
}