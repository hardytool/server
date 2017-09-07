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

function getAdmins(db) {
  var select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.avatar,
    COALESCE(profile.name, steam_user.name) AS name,
    admin.title,
    admin.description
  FROM
    admin
  JOIN steam_user ON
    admin.steam_id = steam_user.steam_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  ORDER BY
    admin.created_at
  `

  return db.query(select).then(result => {
    return result.rows
  })
}

module.exports = db => {
  return {
    isAdmin: isAdmin.bind(null, db),
    getAdmins: getAdmins.bind(null, db)
  }
}
