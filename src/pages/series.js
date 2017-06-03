var emojify = require('../lib/emojify')
var shortid = require('shortid')

function list(templates, season, series, req, res) {
  if (!req.user) {
    res.send(403)
    return
  }

  var season_id = emojify.unemojify(req.params.season_id)
  var serial = req.query.serial

  season.getSeason(season_id).then(season => {
    season.vanity = emojify.emojify(season.id)
    return series.getSeries({
      season_id: season_id,
      serial: serial
    }).then(series => {
      series = series.map(_series => {
        _series.vanity = emojify.emojify(_series.id)
        _series.season_vanity = emojify.emojify(_series.season_id)
        _series.home = {}
        _series.home.id = _series.home_team_id
        _series.home.name = _series.home_team_name
        _series.home.logo = _series.home_team_logo
        _series.home.points = _series.home_points
        _series.away = {}
        _series.away.id = _series.away_team_id
        _series.away.name = _series.away_team_name
        _series.away.logo = _series.away_team_logo
        _series.away.points = _series.away_points
        return _series
      })
      var html = templates.series.list({
        season: season,
        series: series
      })

      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, season, team, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = emojify.unemojify(req.params.season_id)
  var id1 = req.body.match_1_id
  var id2 = req.body.match_2_id
  if (!id1) {
    req.body.match_1_id = null
  }
  if (!id2) {
    req.body.match_2_id = null
  }
  var forfeit1 = req.body.match_1_forfeit_home
  var forfeit2 = req.body.match_2_forfeit_home
  if (forfeit1 === 'on') {
    req.body.match_1_forfeit_home = true
  } else {
    req.body.match_1_forfeit_home = false
  }
  if (forfeit2 === 'on') {
    req.body.match_2_forfeit_home = true
  } else {
    req.body.match_2_forfeit_home = false
  }

  season.getSeason(season_id).then(season => {
    return team.getTeams(season_id).then(teams => {
      var html = templates.series.edit({
        verb: 'Create',
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

function edit(templates, season, team, series, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = emojify.unemojify(req.params.season_id)
  var id = emojify.unemojify(req.params.id)

  season.getSeason(season_id).then(season => {
    return team.getTeams(season_id).then(teams => {
      return series.getSeries({ series_id: id }).then(series => {
        series = series[0]
        series.home = {}
        series.home.id = series.home_team_id
        series.home.name = series.home_team_name
        series.home.logo = series.home_team_logo
        series.home.points = series.home_points
        series.away = {}
        series.away.id = series.away_team_id
        series.away.name = series.away_team_name
        series.away.logo = series.away_team_logo
        series.away.points = series.away_points
        var html = templates.series.edit({
          verb: 'Edit',
          season: season,
          teams: teams,
          series: series
        })

        res.send(html)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(series, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_vanity = emojify.emojify(req.body.season_id)
  var id = req.body.id ? req.body.id : shortid.generate()
  var s = req.body
  s.id = id


  series.saveSeries(s).then(() => {
    res.redirect('/seasons/' + season_vanity + '/series')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(series, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_vanity = emojify.emojify(req.body.season_id)
  var id = req.body.id ? req.body.id : shortid.generate()
  var s = req.body
  s.id = id

  series.deleteSeries(req.body.id).then(() => {
    res.redirect('/seasons/' + season_vanity + '/series')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}



module.exports = (templates, season, team, series) => {
  return {
    list: {
      route: '/seasons/:season_id/series',
      handler: list.bind(null, templates, season, series)
    },
    create: {
      route: '/seasons/:season_id/series/create',
      handler: create.bind(null, templates, season, team),
    },
    edit: {
      route: '/seasons/:season_id/series/edit/:id',
      handler: edit.bind(null, templates, season, team, series),
    },
    post: {
      route: '/series/edit',
      handler: post.bind(null, series)
    },
    remove: {
      route: '/series/delete',
      handler: remove.bind(null, series)
    }
  }
}
