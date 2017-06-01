var sql = require('pg-sql').sql

function getList(db, season_id) {
  var select = sql`
  SELECT
    id,
    season_id,
    name,
    logo,
    seed
  FROM
    team
  WHERE
    season_id = ${season_id}
  `
  return db.query(select)
}

module.exports = db => {
  return {
    getList: getList.bind(null, db)
  }
}
