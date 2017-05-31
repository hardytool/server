var sql = require('pg-sql').sql

function steamIdReturn(config, db, req, res) {
  if (!config.server.website_url) {
    /*db.query(sql`
      SELECT
        *
      FROM
        steam_user
      WHERE
        steam_id = ${req.user.id}
    `)*/
    res.redirect('/')
  } else {
    res.redirect(config.server.website_url)
  }
}

function logout(config, req, res) {
  if (req.user) {
    req.logout()
  }

  if (!config.server.website_url) {
    res.redirect('/')
  } else {
    res.redirect(config.server.website_url)
  }
}

module.exports = function(config, db) {
  return {
    steamIdReturn: steamIdReturn.bind(null, config, db),
    logout: logout.bind(null, config)
  }
}
