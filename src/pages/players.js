var shortid = require('shortid')
var csv = require('../lib/csv')

function list(templates, season, player, req, res) {
  var includeCaptains = req.query.includeCaptains === '1'
    || req.query.includeCaptains === 'true'
    ? true
    : false
  var includeStandins = req.query.includeStandins === '1'
    || req.query.includeStandins === 'true'
    ? true
    : false
  var season_id = req.params.season_id
  season.getSeason(season_id).then(season => {
    return player.getPlayers({
      season_id: season_id,
      is_captain: false,
      is_standin: false,
      hide_captains: !includeCaptains,
      hide_standins: !includeStandins
    }).then(players => {
      var html = templates.player.list({
        user: req.user,
        season: season,
        players: players,
        noun: 'Players'
      })

      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function captains(templates, season, player, req, res) {
  var season_id = req.params.season_id
  season.getSeason(season_id).then(season => {
    return player.getPlayers({
      season_id: season_id,
      is_captain: true
    }, {
      by_name: true
    }).then(players => {
      var html = templates.player.captains({
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

function standins(templates, season, player, req, res) {
  var season_id = req.params.season_id
  season.getSeason(season_id).then(season => {
    return player.getPlayers({
      season_id: season_id,
      is_standin: true
    }, {
      by_mmr: true
    }).then(players => {
      var html = templates.player.standins({
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
  p.statement = p.statement.slice(0, 500)
  p.is_draftable = p.is_draftable === 'on'

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

function getCSV(player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  player.getDraftSheet({
    season_id: req.params.season_id,
    is_captain: false,
    hide_captains: true
  }).then(players => {
    return csv.toCSV(players).then(csv => {
      res.setHeader('Content-Type', 'text/csv')
      res.end(csv)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function currentPlayers(func, templates, season, player, req, res) {
  if (!req.params) {
    req.params = {}
  }
  season.getActiveSeason().then(_season => {
    req.params.season_id = _season.id
    return func(templates, season, player, req, res)
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
    captains: {
      route: '/seasons/:season_id/captains',
      handler: captains.bind(null, templates, season, player)
    },
    standins: {
      route: '/seasons/:season_id/stand-ins',
      handler: standins.bind(null, templates, season, player)
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
    },
    csv: {
      route: '/seasons/:season_id/players/draftsheet',
      handler: getCSV.bind(null, player)
    },
    currentPlayers: {
      route: '/players',
      handler: currentPlayers.bind(null, list, templates, season, player)
    },
    currentCaptains: {
      route: '/captains',
      handler: currentPlayers.bind(null, captains, templates, season, player)
    },
    currentStandins: {
      route: '/stand-ins',
      handler: currentPlayers.bind(null, standins, templates, season, player)
    }
  }
}
