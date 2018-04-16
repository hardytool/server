var sql = require('pg-sql').sql

function saveRoleRank(db, player_id, role_id, rank) {
  var upsert = sql`
  INSERT INTO player_role (
    player_id,
    role_id,
    rank
  ) VALUES (
    ${player_id},
    ${role_id},
    ${rank}
  ) ON CONFLICT (
    player_id,
    role_id
  ) DO UPDATE SET
    rank = ${rank}
  `
  return db.query(upsert)
}

function getRoleRanks(db, criteria) {
  var select = sql`
  SELECT
    player_role.player_id,
    player_role.role_id,
    player_role.rank
  FROM
    player_role
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.player_id) {
      select = sql.join([select, sql`
      AND
        player_role.player_id = ${criteria.player_id}
      `])
    }
  }
  return db.query(select).then(result => {
    return result.rows
  })
}

module.exports = db => {
  return {
    saveRoleRank: saveRoleRank.bind(null, db),
    getRoleRanks: getRoleRanks.bind(null, db)
  }
}
