var sql = require('pg-sql').sql

function saveAdminGroup(db, admin_group) {
  var upsert = sql`
  INSERT INTO admin_group (
    id,
    name,
    owner_id
  ) VALUES (
    ${admin_group.id},
    ${admin_group.name},
    ${admin_group.owner_id}
  ) ON CONFLICT (
    id
  ) DO UPDATE SET
    name = ${admin_group.name},
    owner_id = ${admin_group.owner_id}
  `
  return db.query(upsert)
}

function getAdminGroups(db, criteria) {
  var select = sql`
  SELECT
    admin_group.id,
    admin_group.name,
    admin_group.owner_id
  FROM
    admin_group
  WHERE
  	1 = 1
  `
  if (criteria) {
    if (criteria.admin_group_id) {
      select = sql.join([select, sql`
      AND
        admin_group.id = ${criteria.admin_group_id}
      `])
    }
  }
  return db.query(select).then(result => {
    return result.rows
  })
}

function getAdminGroupNames(db) {
  var select = sql`
  SELECT
    admin_group.id,
    admin_group.name
  FROM
    admin_group
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function deleteAdminGroup(db, admin_group_id) {
  var query = sql`
  DELETE FROM
    admin_group
  WHERE
    admin_group.id = ${admin_group_id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    saveAdminGroup: saveAdminGroup.bind(null, db),
    getAdminGroups: getAdminGroups.bind(null, db),
    getAdminGroupNames: getAdminGroupNames.bind(null, db),
    deleteAdminGroup: deleteAdminGroup.bind(null, db)
  }
}
