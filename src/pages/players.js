var shortid = require('shortid')

function list(templates, season, player, req, res) {
  var season_id = req.params.season_id
  season.getSeason(season_id).then(season => {
    return player.getPlayers({season_id: season_id}).then(players => {
      var html = templates.player.list({
        user: req.user,
        season: season,
        players: players
      })

      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, season, steam_user, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id

  season.getSeason(season_id).then(season => {
    return steam_user.getNonPlayerSteamUsers(season.id).then(steamUsers => {
      var html = templates.player.edit({
        user: req.user,
        verb: 'Create',
        season: season,
        steamUsers: steamUsers
      })

      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function edit(templates, season, player, steam_user, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id
  var id = req.params.id

  season.getSeason(season_id).then(season => {
    return player.getPlayer(id).then(player => {
      var html = templates.player.edit({
        user: req.user,
        verb: 'Edit',
        player: player,
        season: season
      })
      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var id = req.body.id ? req.body.id : shortid.generate()
  var p = req.body
  p.id = id
  p.captain_approved = p.captain_approved === 'on'

  player.savePlayer(p).then(() => {
    res.redirect('/seasons/' + season_id + '/players')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var id = req.body.id

  player.deletePlayer(id).then(() => {
    res.redirect('/seasons/' + season_id + '/players')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, season, player, steam_user) => {
  return {
    list: {
      route: '/seasons/:season_id/players',
      handler: list.bind(null, templates, season, player)
    },
    create: {
      route: '/seasons/:season_id/players/create',
      handler: create.bind(null, templates, season, steam_user),
    },
    edit: {
      route: '/seasons/:season_id/players/:id/edit',
      handler: edit.bind(null, templates, season, player, steam_user),
    },
    post: {
      route: '/players/edit',
      handler: post.bind(null, player)
    },
    remove: {
      route: '/players/delete',
      handler: remove.bind(null, player)
    }
  }
}
