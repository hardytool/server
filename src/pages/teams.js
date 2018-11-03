var shortid = require('shortid')

function list(templates, season, division, team, req, res) {
  var season_id = req.params.season_id
  var division_id = req.params.division_id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeams(season_id, division_id).then(teams => {
        var html = templates.team.list({
          user: req.user,
          season: season,
          division: division,
          teams: teams
        })

        res.send(html)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, season, division, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id
  var division_id = req.params.division_id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      var html = templates.team.edit({
        user: req.user,
        verb: 'Create',
        season: season,
        division: division,
        csrfToken: req.csrfToken()
      })

      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function edit(templates, season, division, team, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id
  var division_id = req.params.division_id
  var id = req.params.id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeam(id).then(team => {
        var html = templates.team.edit({
          user: req.user,
          verb: 'Edit',
          team: team,
          season: season,
          division: division,
          csrfToken: req.csrfToken()
        })
        res.send(html)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(team, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var division_id = req.body.division_id
  var id = req.body.id ? req.body.id : shortid.generate()
  var t = req.body
  t.id = id
  t.disbanded = t.disbanded == 'on' ? true : false
  t.team_number = t.team_number === '' ? null : t.team_number

  team.saveTeam(t).then(() => {
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + t.id)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(team, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var division_id = req.body.division_id
  var id = req.body.id

  team.deleteTeam(id).then(() => {
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/teams')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function json(team, season, team_player, req, res) {
  season.getActiveSeason().then(_season => {
    return team.getAllSeasonTeams(_season.id).then(teams => {
      var promises = teams.map(_team => {
        return team_player.getRoster(_team.id).then(roster => {
          _team.captain = {'name': _team.captain_name, 'id': _team.captain_id}
          _team.player = roster
          return _team
        })
      })
      return Promise.all(promises).then(teams => {
        return teams
      })
    }).then(teams => {
      res.send({
        [_season.name]: teams
      })
    })
  })
}

module.exports = (templates, season, division, team, team_player) => {
  return {
    list: {
      route: '/seasons/:season_id/divisions/:division_id/teams',
      handler: list.bind(null, templates, season, division, team)
    },
    create: {
      route: '/seasons/:season_id/divisions/:division_id/teams/create',
      handler: create.bind(null, templates, season, division)
    },
    edit: {
      route: '/seasons/:season_id/divisions/:division_id/teams/:id/edit',
      handler: edit.bind(null, templates, season, division, team)
    },
    post: {
      route: '/teams/edit',
      handler: post.bind(null, team)
    },
    remove: {
      route: '/teams/delete',
      handler: remove.bind(null, team)
    },
    json: {
      route: '/teams/json',
      handler: json.bind(null, team, season, team_player)
    }
  }
}
