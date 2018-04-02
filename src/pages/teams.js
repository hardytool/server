var shortid = require('shortid')

function list(templates, season, team, req, res) {
  var season_id = req.params.season_id

  season.getSeason(season_id).then(season => {
    return team.getTeams(season_id).then(teams => {
      var html = templates.team.list({
        user: req.user,
        season: season,
        teams: teams
      })

      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, season, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id

  season.getSeason(season_id).then(season => {
    var html = templates.team.edit({
      user: req.user,
      verb: 'Create',
      season: season
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function edit(templates, season, team, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id
  var id = req.params.id

  season.getSeason(season_id).then(season => {
    return team.getTeam(id).then(team => {
      var html = templates.team.edit({
        user: req.user,
        verb: 'Edit',
        team: team,
        season: season
      })
      res.send(html)
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
  var id = req.body.id ? req.body.id : shortid.generate()
  var t = req.body
  t.id = id
  t.disbanded = t.disbanded == 'on' ? true : false

  team.saveTeam(t).then(() => {
    res.redirect('/seasons/' + season_id + '/teams/' + t.id)
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
  var id = req.body.id

  team.deleteTeam(id).then(() => {
    res.redirect('/seasons/' + season_id + '/teams')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function currentTeams(templates, season, team, req, res) {
  if (!req.params) {
    req.params = {}
  }
  season.getActiveSeason().then(_season => {
    req.params.season_id = _season.id
    return list(templates, season, team, req, res)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, season, team) => {
  return {
    list: {
      route: '/seasons/:season_id/division/:division_id/teams',
      handler: list.bind(null, templates, season, team)
    },
    create: {
      route: '/seasons/:season_id/division/:division_id/teams/create',
      handler: create.bind(null, templates, season)
    },
    edit: {
      route: '/seasons/:season_id/division/:division_id/teams/:id/edit',
      handler: edit.bind(null, templates, season, team)
    },
    post: {
      route: '/teams/edit',
      handler: post.bind(null, team)
    },
    remove: {
      route: '/teams/delete',
      handler: remove.bind(null, team)
    }
  }
}
