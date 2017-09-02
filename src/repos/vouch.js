var sql = require('pg-sql').sql

function isVouched(db, steam_id) {
  var select = sql`
  SELECT
    COUNT(1) > 0 as is_vouched
  FROM
    vouch
  WHERE
    vouched_id = ${steam_id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function vouch(db, voucher_id, vouchee_id) {
  var upsert = sql`
  INSERT INTO vouch (
    vouched_id,
    voucher_id
  ) VALUES (
    ${vouchee_id},
    ${voucher_id}
  )
  ON CONFLICT (
    vouched_id
  ) DO NOTHING
  `
  return db.query(upsert)
}

function unvouch(db, steam_id) {
  var query = sql`
  DELETE FROM
    vouch
  WHERE
    vouched_id = ${steam_id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    isVouched: isVouched.bind(null, db),
    vouch: vouch.bind(null, db),
    unvouch: unvouch.bind(null, db)
  }
}
