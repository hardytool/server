const shortid = require('shortid')

function list(templates, season, series, division, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const round = req.query.round

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return series.getSeries({
        season_id: season_id,
        division_id: division_id,
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
        const html = templates.series.list({
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

  const season_id = req.params.season_id
  const division_id = req.params.division_id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeams(season.id, division.id).then(teams => {
        const html = templates.series.edit({
          user: req.user,
          verb: 'Create',
          season: season,
          division: division,
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

  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const id = req.params.id

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
          const html = templates.series.edit({
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

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id ? req.body.id : shortid.generate()
  const s = req.body
  s.id = id
  if (s.home_team_id === '') {
    s.home_team_id = null
  }
  if (s.away_team_id === '') {
    s.away_team_id = null
  }
  const match1 = s.match_1_url
  const match2 = s.match_2_url
  if (!match1) {
    s.match_1_url = null
  }
  if (!match2) {
    s.match_2_url = null
  }
  const forfeit1 = s.match_1_forfeit_home
  const forfeit2 = s.match_2_forfeit_home
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
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
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

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id

  series.deleteSeries(id).then(() => {
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function standings(templates, season, team, series, pairings, division, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const round = Number.parseInt(req.params.round)

  series.getCurrentRound(season_id, division_id).then(maximumRound => {
    series.getCurrentRound(season_id, division_id, round).then(round => {
      return season.getSeason(season_id).then(season => {
        return division.getDivision(division_id).then(division => {
          return team.getTeams(season.id, division.id).then(teams => {
            return series.getSeries({
              season_id: season.id,
              division_id: division.id,
              round: round
            }).then(series => {
              let standings = pairings.getStandings(
                round,
                teams,
                mapSeries(series)
              )
              let counter = 1
              standings = standings.map(standing => {
                const team = teams.filter(team => team.id === standing.id)[0]
                standing.name = team.name
                standing.logo = team.logo
                standing.captain_name = team.captain_name
                standing.disbanded = team.disbanded
                if (standing.disbanded) {
                  standing.placement = '-'
                } else {
                  standing.placement = counter
                  counter++
                }
                return standing
              })
              const html = templates.series.standings({
                user: req.user,
                season: season,
                division: division,
                round: round,
                maximumRound: maximumRound,
                standings: standings
              })
              res.send(html)
            })
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
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const round = Number.parseInt(req.params.round)

  series.getCurrentRound(season_id, division_id).then(maximumRound => {
    return series.getCurrentRound(season_id, division_id, round).then(round => {
      return season.getSeason(season_id).then(season => {
        return division.getDivision(division_id).then(division => {
          return team.getTeams(season.id, division.id).then(teams => {
            teams = teams.map(t => {
              t.droppedOut = t.disbanded
              return t
            })
            if (round === 0) {
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
              division_id: division.id,
              round: round
            }).then(series => {
              let matchups = pairings.getMatchups(
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

              const html = templates.series.matchups({
                user: req.user,
                season: season,
                division: division,
                round: round,
                maximumRound: maximumRound,
                matchups: matchups
              })
              res.send(html)
            })
          })
        })
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

async function playoff(templates, _season, _team, _series, _pairings, _division, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await _season.getSeason(season_id);
  const division = await _division.getDivision(division_id);
  const teams = await _team.getTeams(season_id, division_id);

  const series = await _series.getPlayoffSeries(season.id, division.id);

  const roundOne = series.filter((matchup) => {
    return matchup.playoff_round === 1;
  });

  const numberOfMatchups = roundOne.length * 2;
  const numRounds = Math.ceil(Math.log2(numberOfMatchups));

  let remainingSeries = series.slice(roundOne.length - 1);
  let currentRoundNum = 2;

  const rounds = [];
  rounds.push(roundOne);

  for (let i = currentRoundNum; i <= numRounds; i++) {
    rounds.push(
      series.filter((matchup) => {
        return matchup.playoff_round === i;
      })
    )
  }

  //fill empty matches where needed
  let matchNum = roundOne.length + 1;
  for (let round = 1; round < numRounds; round++) {
    for (let matchInRound = 0; matchInRound < numberOfMatchups/Math.pow(2,round+1); matchInRound++) {
      if (!rounds[round][matchInRound] || rounds[round][matchInRound].playoff_match_num !== matchNum) {
        rounds[round].splice(matchInRound, 0, {playoff_match_num: matchNum});
      }
      matchNum++;
    }
  }

  const html = templates.series.playoff({
    user: req.user,
    rounds: rounds
  });

  res.send(html)

}

function editRound(templates, season, division, series, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  series.getCurrentRound(season_id, division_id).then(round => {
    const html = templates.series.round({
      user: req.user,
      season_id: season_id,
      division_id: division_id,
      round: round,
      csrfToken: req.csrfToken()
    })
    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function saveRound(series, req, res) {
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const round = req.body.round

  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  series.saveCurrentRound(season_id, division_id, round).then(() => {
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

//THIS IS A STOPGAP UNTIL WE GET NEW SEASON ROUND STUFF SORTED
function newRound(series, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const round = 0

  series.saveCurrentRound(season_id, division_id, round).then(() => {
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
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

function importSeries(series, season, team, pairings, division, req, res) {
  // Can't run if you are not an admin
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const round = Number.parseInt(req.params.round)

  series.getCurrentRound(season_id, division_id, round).then(round => {
    return season.getSeason(season_id).then(season => {
      return division.getDivision(division_id).then(division => {
        return team.getTeams(season.id, division.id).then(teams => {
          teams = teams.map(t => {
            t.droppedOut = t.disbanded
            return t
          })
          if (round === 0) {
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
            division_id: division.id,
            round: round
          }).then(_series => {
            let matchups = pairings.getMatchups(
              round,
              teams,
              mapSeries(_series)
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

            const promises = matchups.map(_matchup => {
              const toSave = {}
              toSave.id = shortid.generate()
              toSave.round = round
              toSave.season_id = season_id
              toSave.division_id = division_id
              toSave.home_team_id = _matchup['home']['id']
              toSave.away_team_id = _matchup['away']['id']
              toSave.home_points = 0
              toSave.away_points = 0
              toSave.match_1_url = null
              toSave.match_2_url = null
              toSave.match_1_forfeit_home = null
              toSave.match_2_forfeit_home = null
              return series.saveSeries(toSave)
            })

            return Promise.all(promises).then(() => {
              res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
            })
          })
        })
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
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
    },
    playoff: {
      route: '/seasons/:season_id/divisions/:division_id/playoff',
      handler: playoff.bind(null, templates, season, team, series, pairings, division)
    },
    editRound: {
      route: '/seasons/:season_id/divisions/:division_id/round/edit',
      handler: editRound.bind(null, templates, season, division, series)
    },
    saveRound: {
      route: '/round/edit',
      handler: saveRound.bind(null, series)
    },
    newRound: {
      route: '/seasons/:season_id/divisions/:division_id/round/newRound',
      handler: newRound.bind(null, series)
    },
    importSeries: {
      route: '/seasons/:season_id/divisions/:division_id/week/:round/importSeries',
      handler: importSeries.bind(null, series, season, team, pairings, division)
    }
  }
}
