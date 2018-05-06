var shortid = require('shortid')

function list(templates, season, series, division, req, res) {
  var season_id = req.params.season_id
  var division_id = req.params.division_id
  var round = req.query.round

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return series.getSeries({
        season_id: season_id,
        round: round
      }).then(series => {
        series = series.map(_series => {
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
          user: req.user,
          season: season,
          division: division,
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

function create(templates, season, team, division, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id
  var division_id = req.params.division_id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeams(season.id, division.id).then(teams => {
        var html = templates.series.edit({
          user: req.user,
          verb: 'Create',
          season: season,
          teams: teams,
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

function edit(templates, season, team, series, division, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id
  var division_id = req.params.division_id
  var id = req.params.id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeams(season.id, division.id).then(teams => {
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
            user: req.user,
            verb: 'Edit',
            season: season,
            division: division,
            teams: teams,
            series: series,
            csrfToken: req.csrfToken()
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

function post(series, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var id = req.body.id ? req.body.id : shortid.generate()
  var s = req.body
  s.id = id
  if (s.home_team_id === '') {
    s.home_team_id = null
  }
  if (s.away_team_id === '') {
    s.away_team_id = null
  }
  var match1 = s.match_1_id
  var match2 = s.match_2_id
  if (!match1) {
    s.match_1_id = null
  }
  if (!match2) {
    s.match_2_id = null
  }
  var forfeit1 = s.match_1_forfeit_home
  var forfeit2 = s.match_2_forfeit_home
  if (forfeit1 === 'home') {
    s.match_1_forfeit_home = true
  } else if (forfeit1 === 'away') {
    s.match_1_forfeit_home = false
  } else {
    s.match_1_forfeit_home = null
  }
  if (forfeit2 === 'home') {
    s.match_2_forfeit_home = true
  } else if (forfeit2 === 'away') {
    s.match_2_forfeit_home = false
  } else {
    s.match_2_forfeit_home = null
  }

  series.saveSeries(s).then(() => {
    res.redirect('/seasons/' + season_id + '/series')
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

  var season_id = req.body.season_id
  var id = req.body.id

  series.deleteSeries(id).then(() => {
    res.redirect('/seasons/' + season_id + '/series')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function standings(templates, season, team, series, pairings, division, req, res) {
  var season_id = req.params.season_id
  var division_id = req.params.division_id
  var round = Number.parseInt(req.params.round)

  series.getCurrentRound(season_id, round).then(round => {
    return season.getSeason(season_id).then(season => {
      return division.getDivision(division_id).then(division => {
        return team.getTeams(season.id, division.id).then(teams => {
          return series.getSeries({
            season_id: season.id,
            round: round
          }).then(series => {
            var standings = pairings.getStandings(
              round,
              teams,
              mapSeries(series)
            )
            standings = standings.map(standing => {
              var team = teams.filter(team => team.id === standing.id)[0]
              standing.name = team.name
              standing.logo = team.logo
              standing.captain_name = team.captain_name
              return standing
            })
            var html = templates.series.standings({
              user: req.user,
              season: season,
              round: round,
              standings: standings
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

function matchups(templates, season, team, series, pairings, division, req, res) {
  var season_id = req.params.season_id
  var division_id = req.params.division_id
  var round = Number.parseInt(req.params.round)

  series.getCurrentRound(season_id, round).then(round => {
    return season.getSeason(season_id).then(season => {
      return division.getDivision(division_id).then(division => {
        return team.getTeams(season.id, division.id).then(teams => {
          teams = teams.map(t => {
            t.droppedOut = t.disbanded
            return t
          })
          if (season.current_round === 0) {
            teams = teams.sort((a, b) => {
              return a.id.localeCompare(b.id)
            })
            teams = teams.map((team, i) => {
              team.seed = i
              return team
            })
          } else {
            teams = teams.sort((a, b) => {
              if (a.seed === b.seed) {
                return a.id.localeCompare(b.id)
              } else {
                return a.seed - b.seed
              }
            })
          }
          return series.getSeries({
            season_id: season.id,
            round: round
          }).then(series => {
            var matchups = pairings.getMatchups(
              round,
              teams,
              mapSeries(series)
            )
            matchups = matchups.map(matchup => {
              matchup.home = teams.filter(team => team.id === matchup.home)[0]
              if (matchup.away === null) {
                matchup.away = {
                  id: null,
                  name: 'BYE',
                  logo: null
                }
              } else {
                matchup.away = teams.filter(team => team.id === matchup.away)[0]
              }
              return matchup
            })
            var html = templates.series.matchups({
              user: req.user,
              season: season,
              division: division,
              round: round,
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

function currentStandings(
  templates,
  _season,
  team,
  series,
  pairings,
  req,
  res) {
  if (!req.params) {
    req.params = {}
  }
  _season.getActiveSeason().then(season => {
    req.params.season_id = season.id
    return series.getCurrentRound(season.id).then(round => {
      req.params.round = round
      return standings(templates, _season, team, series, pairings, req, res)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function currentMatchups(templates, _season, team, series, pairings, division, req, res) {
  if (!req.params) {
    req.params = {}
  }
  _season.getActiveSeason().then(season => {
    req.params.season_id = season.id
    return series.getCurrentRound(season.id).then(round => {
      req.params.round = round
      return matchups(templates, _season, team, series, pairings, division, req, res)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function mapSeries(series) {
  return series.map(series => {
    return {
      round: series.round,
      home: {
        id: series.home_team_id,
        points: series.home_points
      },
      away: {
        id: series.away_team_id,
        points: series.away_points
      }
    }
  })
}

module.exports = (templates, season, team, series, pairings, division) => {
  return {
    list: {
      route: '/seasons/:season_id/divisions/:division_id/series',
      handler: list.bind(null, templates, season, series, division)
    },
    create: {
      route: '/seasons/:season_id/divisions/:division_id/series/create',
      handler: create.bind(null, templates, season, team, division),
    },
    edit: {
      route: '/seasons/:season_id/divisions/:division_id/series/:id/edit',
      handler: edit.bind(null, templates, season, team, series, division),
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
      route: '/seasons/:season_id/divisions/:division_id/standings/:round?',
      handler: standings.bind(null, templates, season, team, series, pairings, division)
    },
    matchups: {
      route: '/seasons/:season_id/divisions/:division_id/matchups/:round?',
      handler: matchups.bind(null, templates, season, team, series, pairings, division)
    }
  }
}
