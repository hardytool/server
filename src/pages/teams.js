var emojify = require('../lib/emojify')
var shortid = require('shortid')

function list(templates, season, team, req, res) {
  var season_id = emojify.unemojify(req.params.season_id)

  season.getSeason(season_id).then(season => {
    season.vanity = emojify.emojify(season.id)
    return team.getTeams(season_id).then(teams => {
      teams = teams.map(team => {
        team.vanity = emojify.emojify(team.id)
        team.season_vanity = emojify.emojify(team.season_id)
        return team
      })
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

  var season_id = emojify.unemojify(req.params.season_id)

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

  var season_id = emojify.unemojify(req.params.season_id)
  var id = emojify.unemojify(req.params.id)

  season.getSeason(season_id).then(season => {
    return team.getTeam(id).then(team => {
      team.vanity = emojify.emojify(team.id)
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
  var season_vanity = emojify.emojify(season_id)
  var id = req.body.id ? req.body.id : shortid.generate()
  var t = req.body
  t.id = id

  team.saveTeam(t).then(() => {
    res.redirect('/seasons/' + season_vanity + '/teams')
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

  var season_vanity = emojify.emojify(req.body.season_id)
  var id = req.body.id

  team.deleteTeam(id).then(() => {
    res.redirect('/seasons/' + season_vanity + '/teams')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, season, team) => {
  return {
    list: {
      route: '/seasons/:season_id/teams',
      handler: list.bind(null, templates, season, team)
    },
    create: {
      route: '/seasons/:season_id/teams/create',
      handler: create.bind(null, templates, season),
    },
    edit: {
      route: '/seasons/:season_id/teams/:id/edit',
      handler: edit.bind(null, templates, season, team),
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
