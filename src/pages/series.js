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
        if (_series.home_team_id) {
          _series.home = {}
          _series.home.id = _series.home_team_id
          _series.home.name = _series.home_team_name
          _series.home.logo = _series.home_team_logo
          _series.home.points = _series.home_points
        }
        if (_series.away_team_id) {
          _series.away = {}
          _series.away.id = _series.away_team_id
          _series.away.name = _series.away_team_name
          _series.away.logo = _series.away_team_logo
          _series.away.points = _series.away_points
        }
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
  if (s.home_team_id === '') {
    s.home_team_id = null
  }
  if (s.away_team_id === '') {
    s.away_team_id = null
  }

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
  var id = req.body.id

  series.deleteSeries(id).then(() => {
    res.redirect('/seasons/' + season_vanity + '/series')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function standings(templates, season, series, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  var season_id = emojify.unemojify(req.params.season_id)

  season.getSeason(season_id).then(season => {
    return series.getStandings(season_id).then(standings => {
      var html = templates.series.standings({
        season: season,
        standings: standings
      })
      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function matchups(templates, _season, _team, _series, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  var season_id = emojify.unemojify(req.params.season_id)
  var serial = Number.parseInt(req.params.serial)

  _series.getNextSerial(season_id, serial).then(serial => {
    return _season.getSeason(season_id).then(season => {
      return _team.getTeams(season_id).then(teams => {
        return _series.getSeries({
          season_id: season_id,
          serial: serial
        }).then(series => {
          return _series.getStandings(season_id, serial).then(standings => {
            var exclusions = teams.reduce((acc, val) => {
              if (!acc.hasOwnProperty(val.id)) {
                acc[val.id] = [val.id]
              }
              return acc
            }, {})

            exclusions = series.reduce((exclusions, series) => {
              if (exclusions[series.home_team_id] &&
                !exclusions[series.home_team_id]
                .includes(series.away_team_id)) {
                exclusions[series.home_team_id].push(series.away_team_id)
              }
              if (exclusions[series.away_team_id] &&
                !exclusions[series.away_team_id]
                .includes(series.home_team_id)) {
                exclusions[series.away_team_id].push(series.home_team_id)
              }
              return exclusions
            }, exclusions)

            var orderedTeams = standings.map(s => {
              return s.id
            })
            // Add BYE to the end of the list
            orderedTeams.push(null)
            var matchups = standings.reduce((matchups, val) => {
              // Don't match any teams that are already matched
              var matched = matchups.filter(matchup => {
                return matchup.home_team_id === val.id ||
                  matchup.away_team_id === val.id
              }).length > 0
              if (matched) {
                return matchups
              }

              var opponent = orderedTeams.filter(id => {
                return !exclusions[val.id].includes(id) &&
                  matchups.filter(matchup => {
                    return matchup.home_team_id === id ||
                      matchup.away_team_id === id
                  }).length === 0
              }).shift()
              // Highest seed is always the home team for now
              var home = val.id
              var away = opponent
              if (away !== undefined) {
                matchups.push({
                  home_team_id: home,
                  away_team_id: away
                })
              }
              return matchups
            }, [])
            matchups = matchups.map(matchup => {
              var home = teams.filter(team => {
                return team.id === matchup.home_team_id
              }).pop()
              var away = teams.filter(team => {
                return team.id === matchup.away_team_id
              }).pop()
              if (away === undefined) {
                away = {
                  id: null,
                  name: 'BYE',
                  logo: null
                }
              }
              return {
                home: home,
                away: away
              }
            })
            var html = templates.series.matchups({
              season: season,
              serial: serial,
              matchups: matchups
            })
            res.send(html)
          })
        })
      })
    })
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
    },
    standings: {
      route: '/seasons/:season_id/standings',
      handler: standings.bind(null, templates, season, series)
    },
    matchups: {
      route: '/seasons/:season_id/matchups/:serial?',
      handler: matchups.bind(null, templates, season, team, series)
    }
  }
}
