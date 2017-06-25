var emojify = require('../lib/emojify')

function list(templates, season, team, team_player, series, req, res) {
  var season_id = emojify.unemojify(req.params.season_id)
  var team_id = emojify.unemojify(req.params.team_id)

  season.getSeason(season_id).then(season => {
    season.vanity = emojify.emojify(season.id)
    return team.getTeam(team_id).then(team => {
      team.vanity = emojify.emojify(team.id)
      return team_player.getRoster(team.id).then(players => {
        return series.getSeries({ team_id: team.id }).then(series => {
          var captain = players.filter(player => {
            return player.is_captain
          })[0]
          players = players.filter(player => {
            return !captain || player.id != captain.id
          })
          series = series.map(_series => {
            _series.vanity = emojify.emojify(_series.id)
            _series.season_vanity = emojify.emojify(_series.season_id)
            if (_series.home_team_id) {
              _series.home = {}
              _series.home.id = _series.home_team_id
              _series.home.vanity = emojify.emojify(_series.home_team_id)
              _series.home.name = _series.home_team_name
              _series.home.logo = _series.home_team_logo
              _series.home.points = _series.home_points
            }
            if (_series.away_team_id) {
              _series.away = {}
              _series.away.id = _series.away_team_id
              _series.away.vanity = emojify.emojify(_series.away_team_id)
              _series.away.name = _series.away_team_name
              _series.away.logo = _series.away_team_logo
              _series.away.points = _series.away_points
            }
            return _series
          })
          var html = templates.roster.list({
            user: req.user,
            season: season,
            team: team,
            captain: captain,
            players: players,
            series: series
          })

          res.send(html)
        })
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function add(templates, season, team, team_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = emojify.unemojify(req.params.season_id)
  var team_id = emojify.unemojify(req.params.team_id)

  season.getSeason(season_id).then(season => {
    season.vanity = emojify.emojify(season.id)
    return team.getTeam(team_id).then(team => {
      team.vanity = emojify.emojify(team.id)
      return team_player.getUnassignedPlayers(season.id).then(players => {
        var html = templates.roster.edit({
          verb: 'Add',
          user: req.user,
          season: season,
          team: team,
          players: players
        })

        res.send(html)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(team_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var season_vanity = emojify.emojify(season_id)
  var team_id = req.body.team_id
  var team_vanity = emojify.emojify(team_id)
  var p = req.body
  if (p.is_captain === 'on') {
    p.is_captain = true
  } else {
    p.is_captain = false
  }

  team_player.addPlayerToTeam(team_id, p.player_id, p.is_captain).then(() => {
    res.redirect(
      '/seasons/' + season_vanity + '/teams/' + team_vanity)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(team_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var season_vanity = emojify.emojify(season_id)
  var team_id = req.body.team_id
  var team_vanity = emojify.emojify(team_id)
  var player_id = req.body.id

  team_player.removePlayerFromTeam(team_id, player_id).then(() => {
    res.redirect(
      '/seasons/' + season_vanity + '/teams/' + team_vanity)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, season, team, team_player, series) => {
  return {
    list: {
      route: '/seasons/:season_id/teams/:team_id',
      handler: list.bind(null, templates, season, team, team_player, series)
    },
    add: {
      route: '/seasons/:season_id/teams/:team_id/add',
      handler: add.bind(null, templates, season, team, team_player)
    },
    post: {
      route: '/roster/edit',
      handler: post.bind(null, team_player)
    },
    remove: {
      route: '/roster/delete',
      handler: remove.bind(null, team_player)
    }
  }
}
