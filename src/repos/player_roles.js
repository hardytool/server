var sql = require('pg-sql').sql

function getPlayerRoles(db, player_id) {
  var select = sql`
  SELECT
    player_roles.role
  FROM
    player_roles
  WHERE
    player_roles.player_id = ${player_id}
  AND
  	player_roles.role > 0
  `
  return db.query(select).then(result => {
    return result.rows
  })
}

function savePlayerRoles(db, player) {
  var upsert = sql`
  INSERT INTO player_roles (
    player_id,
    role
  ) VALUES 
  (
    ${player.id},
    ${player.role_preference1}
  ),
  (
    ${player.id},
    ${player.role_preference2}
  ),
  (
    ${player.id},
    ${player.role_preference3} 
  )
  ON CONFLICT (
    player_id, role
  ) DO NOTHING
  `
  return db.query(upsert)
}

module.exports = db => {
  return {
  	getPlayerRoles: getPlayerRoles.bind(null, db),
    savePlayerRoles: savePlayerRoles.bind(null, db)
  }
}