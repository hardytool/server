const sql = require('pg-sql').sql

function getIPAddresses(db) {
  const select = sql`
  SELECT
    ip_address.steam_id,
    ip_address.ip,
    steam_user.avatar,
    steam_user.name AS steam_name,
    profile.discord_name,
    COALESCE(profile.name, steam_user.name) AS name
  FROM
    ip_address
  JOIN steam_user ON
    steam_user.steam_id = ip_address.steam_id
  JOIN profile ON
    profile.steam_id = ip_address.steam_id
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function saveIPAddress(db, ip, steamId) {
  const insert = sql`
  INSERT INTO ip_address (
    ip,
    steam_id
  ) VALUES (
    ${ip},
    ${steamId}
  ) ON CONFLICT (
    ip,
    steam_id
  ) DO NOTHING
  `
  return db.query(insert)
}

module.exports = db => {
  return {
    getIPAddresses: getIPAddresses.bind(null, db),
    saveIPAddress: saveIPAddress.bind(null, db),
  }
}
