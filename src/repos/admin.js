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

function saveAdmin(db, admin) {
  var upsert = sql`
  INSERT INTO admin (
    steam_id,
    group_id,
    division_id
  ) VALUES (
    ${admin.steam_id},
    ${admin.group_id},
    ${admin.division_id}
  ) ON CONFLICT (
    steam_id
  ) DO UPDATE SET
    group_id = ${admin.group_id},
    division_id = ${admin.division_id}
  `
  return db.query(upsert)
}

function getAdmins(db, criteria) {
  var select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.avatar,
    COALESCE(profile.name, steam_user.name) AS name,
    admin.group_id,
    admin.division_id,
    division.name AS division_name,
    admin_group.name AS admin_group_name
  FROM
    admin
  JOIN steam_user ON
    admin.steam_id = steam_user.steam_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  LEFT JOIN division ON
    admin.division_id = division.id
  LEFT JOIN admin_group ON
    admin.group_id = admin_group.id
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.steam_id) {
      select = sql.join([select, sql`
      AND
        steam_user.steam_id = ${criteria.steam_id}
      `])
    }
  }

  return db.query(select).then(result => {
    return result.rows
  })
}

function getDivisionAdmins(db, id) {
  var select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.avatar,
    COALESCE(profile.name, steam_user.name) AS name,
    admin.group_id,
    admin.division_id
  FROM
    admin
  JOIN steam_user ON
    admin.steam_id = steam_user.steam_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  WHERE admin.division_id = ${id}
  `

  return db.query(select).then(result => {
    return result.rows
  })
}

function deleteAdmin(db, id) {
    var query = sql`
      DELETE FROM
        admin
      WHERE
        steam_id = ${id}
    `
  return db.query(query)
}

module.exports = db => {
  return {
    saveAdmin: saveAdmin.bind(null, db),
    isAdmin: isAdmin.bind(null, db),
    getAdmins: getAdmins.bind(null, db),
    getDivisionAdmins: getDivisionAdmins.bind(null, db),
    deleteAdmin: deleteAdmin.bind(null, db)
  }
}
