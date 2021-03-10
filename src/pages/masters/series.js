const shortid = require('shortid')

async function list(templates, masters, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)

  const series = await masters.getSeries({
    season_id: season_id,
    division_id: division_id
  })

  const groupedSeries = []
  for (const s of series) {
    if (groupedSeries.length < s.group_number) {
      groupedSeries.push([])
    }

    groupedSeries[s.group_number - 1].push(s)
  }

  for (let g = 0; g < groupedSeries.length; g++) {
    groupedSeries[g] = groupedSeries[g].map(_series => {
      if (_series.home_team_id) {
        _series.home = {}
        _series.home.id = _series.home_team_id
        _series.home.name = `${_series.home_team_name} (${_series.home_team_scheduler_discord_id.split('#')[0]})`
        _series.home.logo = _series.home_team_logo
        _series.home.points = _series.home_points
      }
      if (_series.away_team_id) {
        _series.away = {}
        _series.away.id = _series.away_team_id
        _series.away.name = `${_series.away_team_name} (${_series.away_team_scheduler_discord_id.split('#')[0]})`
        _series.away.name = _series.away_team_name
        _series.away.logo = _series.away_team_logo
        _series.away.points = _series.away_points
      }
      return _series
    })
  }

  const html = templates.masters.series.list({
    user: req.user,
    season: season,
    division: division,
    groupedSeries: groupedSeries
  })

  res.send(html)
}

async function create(templates, masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)
  const teams = await masters.getTeams(season.id, division.id)

  const html = templates.masters.series.edit({
    user: req.user,
    verb: 'Create',
    season: season,
    division: division,
    teams: teams,
    csrfToken: req.csrfToken()
  })

  res.send(html)
}

async function edit(templates, masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const id = req.params.id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)
  const teams = await masters.getTeams(season.id, division.id)
  let series = await masters.getSeries({ series_id: id })

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

  const html = templates.masters.series.edit({
    user: req.user,
    verb: 'Edit',
    season: season,
    division: division,
    teams: teams,
    series: series,
    csrfToken: req.csrfToken()
  })

  res.send(html)
}

async function post(masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id ? req.body.id : shortid.generate()
  const series = req.body
  series.id = id
  if (series.home_team_id === '') {
    series.home_team_id = null
  }
  if (series.away_team_id === '') {
    series.away_team_id = null
  }
  const match1 = series.match_1_url
  const match2 = series.match_2_url
  if (!match1) {
    series.match_1_url = null
  }
  if (!match2) {
    series.match_2_url = null
  }
  const forfeit1 = series.match_1_forfeit_home
  const forfeit2 = series.match_2_forfeit_home
  if (forfeit1 === 'home') {
    series.match_1_forfeit_home = true
  } else if (forfeit1 === 'away') {
    series.match_1_forfeit_home = false
  } else {
    series.match_1_forfeit_home = null
  }
  if (forfeit2 === 'home') {
    series.match_2_forfeit_home = true
  } else if (forfeit2 === 'away') {
    series.match_2_forfeit_home = false
  } else {
    series.match_2_forfeit_home = null
  }

  await masters.saveSeries(series)
  res.redirect('/masters/seasons/' + season_id + '/divisions/' + division_id + '/series')
}

async function remove(masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id

  await masters.deleteSeries(id)
  res.redirect('/masters/seasons/' + season_id + '/divisions/' + division_id + '/series')
}

async function standings(templates, masters, pairings, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)
  const currentRound = await masters.getCurrentRound(season_id, division_id)

  const teams = await masters.getTeams(season.id, division.id)
  const series = await masters.getSeries({
    season_id: season.id,
    division_id: division.id
  })

  if (series.length < 1) {
    const html = templates.masters.series.standings({
      user: req.user,
      season: season,
      division: division,
      round: currentRound,
      groupedStandings: []
    })
    return res.send(html)
  }

  let numGroups = 0
  const groupedSeries = []
  const groupedTeams = []

  for (const t of teams) {
    numGroups = Math.max(numGroups, t.group_number)

    if (groupedTeams.length < t.group_number) {
      groupedTeams.push([])
    }

    groupedTeams[t.group_number - 1].push(t)
  }

  for (const s of series) {
    if (groupedSeries.length < s.group_number) {
      groupedSeries.push([])
    }

    groupedSeries[s.group_number - 1].push({
      round: s.round,
      home: {
        id: s.home_team_id,
        points: s.home_points
      },
      away: {
        id: s.away_team_id,
        points: s.away_points
      }
    })
  }

  const groupedStandings = []
  for (let g = 0; g < numGroups; g++) {
    let standings = pairings.getStandings(
      currentRound,
      groupedTeams[g],
      groupedSeries[g]
    )

    let counter = 1
    standings = standings.map(standing => {
      const team = groupedTeams[g].find((t) => t.id === standing.id)
      standing.name = team.name
      standing.logo = team.logo
      standing.captain_name = team.scheduler_discord_id.split('#')[0]
      standing.disbanded = team.disbanded
      if (standing.disbanded) {
        standing.placement = '-'
      } else {
        standing.placement = counter
        counter++
      }
      return standing
    })

    groupedStandings.push(standings)
  }

  const html = templates.masters.series.standings({
    user: req.user,
    season: season,
    division: division,
    round: currentRound,
    groupedStandings: groupedStandings
  })
  res.send(html)
}

async function matchups(templates, masters, pairings, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)
  const currentRound = await masters.getCurrentRound(season_id, division_id)

  let teams = await masters.getTeams(season.id, division.id)
  const series = await masters.getSeries({
    season_id: season.id,
    division_id: division.id,
    round: currentRound
  })

  teams = teams.map(t => {
    t.droppedOut = t.disbanded
    return t
  })

  let numGroups = 0
  const groupedSeries = []
  const groupedTeams = []
  const groupedMatchups = []

  for (const t of teams) {
    numGroups = Math.max(numGroups, t.group_number)

    if (groupedTeams.length < t.group_number) {
      groupedTeams.push([])
    }

    groupedTeams[t.group_number - 1].push(t)
  }

  for (const s of series) {
    if (groupedSeries.length < s.group_number) {
      groupedSeries.push([])
    }

    groupedSeries[s.group_number - 1].push({
      round: s.round,
      home: {
        id: s.home_team_id,
        points: s.home_points
      },
      away: {
        id: s.away_team_id,
        points: s.away_points
      }
    })
  }

  for (let g = 0; g < groupedTeams.length; g++) {
    if (currentRound === 0) {
      groupedTeams[g] = groupedTeams[g].sort((a, b) => {
        return a.id.localeCompare(b.id)
      })
      groupedTeams[g] = groupedTeams[g].map((team, i) => {
        team.seed = i
        return team
      })
    } else {
      groupedTeams[g] = groupedTeams[g].sort((a, b) => {
        if (a.seed === b.seed) {
          return a.id.localeCompare(b.id)
        } else {
          return a.seed - b.seed
        }
      })
    }

    let matchups = pairings.getMatchups(
      currentRound,
      groupedTeams[g],
      groupedSeries[g] || []
    )

    matchups = matchups.map((matchup) => {
      matchup.home = teams.filter((team) => team.id === matchup.home)[0]
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

    groupedMatchups.push(matchups)
  }

  const html = templates.masters.series.matchups({
    user: req.user,
    season: season,
    division: division,
    round: currentRound,
    groupedMatchups: groupedMatchups
  })
  res.send(html)
}

async function importSeries(masters, pairings, req, res) {
  // Can't run if you are not an admin
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)
  const currentRound = await masters.getCurrentRound(season_id, division_id)

  let teams = await masters.getTeams(season.id, division.id)
  const series = await masters.getSeries({
    season_id: season.id,
    division_id: division.id,
    round: currentRound
  })

  teams = teams.map(t => {
    t.droppedOut = t.disbanded
    return t
  })

  let numGroups = 0
  const groupedSeries = []
  const groupedTeams = []
  const promises = []

  for (const t of teams) {
    numGroups = Math.max(numGroups, t.group_number)

    if (groupedTeams.length < t.group_number) {
      groupedTeams.push([])
    }

    groupedTeams[t.group_number - 1].push(t)
  }

  for (const s of series) {
    if (groupedSeries.length < s.group_number) {
      groupedSeries.push([])
    }

    groupedSeries[s.group_number - 1].push(s)
  }

  for (let g = 0; g < groupedTeams.length; g++) {
    if (currentRound === 0) {
      groupedTeams[g] = groupedTeams[g].sort((a, b) => {
        return a.id.localeCompare(b.id)
      })
      groupedTeams[g] = groupedTeams[g].map((team, i) => {
        team.seed = i
        return team
      })
    } else {
      groupedTeams[g] = groupedTeams[g].sort((a, b) => {
        if (a.seed === b.seed) {
          return a.id.localeCompare(b.id)
        } else {
          return a.seed - b.seed
        }
      })
    }

    let matchups = pairings.getMatchups(
      currentRound,
      groupedTeams[g],
      groupedSeries[g] || []
    )

    matchups = matchups.map((matchup) => {
      matchup.home = teams.filter((team) => team.id === matchup.home)[0]
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

    for (const matchup of matchups) {
      const toSave = {}
      toSave.id = shortid.generate()
      toSave.round = currentRound
      toSave.season_id = season_id
      toSave.division_id = division_id
      toSave.home_team_id = matchup['home']['id']
      toSave.away_team_id = matchup['away']['id']
      toSave.home_points = 0
      toSave.away_points = 0
      toSave.match_1_url = null
      toSave.match_2_url = null
      toSave.match_1_forfeit_home = null
      toSave.match_2_forfeit_home = null
      promises.push(masters.saveSeries(toSave))
    }
  }

  await Promise.all(promises)
  res.redirect('/masters/seasons/' + season_id + '/divisions/' + division_id + '/series')
}

async function editRound(templates, masters, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const currentRound = await masters.getCurrentRound(season_id, division_id)

  const html = templates.masters.series.round({
    user: req.user,
    season_id: season_id,
    division_id: division_id,
    round: currentRound,
    csrfToken: req.csrfToken()
  })
  res.send(html)
}

async function saveRound(masters, req, res) {
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const round = req.body.round

  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  await masters.saveCurrentRound(season_id, division_id, round)
  res.redirect('/masters/seasons/' + season_id + '/divisions/' + division_id + '/series')
}

module.exports = (templates, masters, pairings) => {
  return {
    list: {
      route: '/masters/seasons/:season_id/divisions/:division_id/series',
      handler: list.bind(null, templates, masters)
    },
    create: {
      route: '/masters/seasons/:season_id/divisions/:division_id/series/create',
      handler: create.bind(null, templates, masters),
    },
    edit: {
      route: '/masters/seasons/:season_id/divisions/:division_id/series/:id/edit',
      handler: edit.bind(null, templates, masters),
    },
    post: {
      route: '/masters/series/edit',
      handler: post.bind(null, masters)
    },
    remove: {
      route: '/masters/series/delete',
      handler: remove.bind(null, masters)
    },
    standings: {
      route: '/masters/seasons/:season_id/divisions/:division_id/standings',
      handler: standings.bind(null, templates, masters, pairings)
    },
    matchups: {
      route: '/masters/seasons/:season_id/divisions/:division_id/matchups',
      handler: matchups.bind(null, templates, masters, pairings)
    },
    importSeries: {
      route: '/masters/seasons/:season_id/divisions/:division_id/week/:round/importSeries',
      handler: importSeries.bind(null, masters, pairings)
    },
    editRound: {
      route: '/masters/seasons/:season_id/divisions/:division_id/round/edit',
      handler: editRound.bind(null, templates, masters)
    },
    saveRound: {
      route: '/masters/round/edit',
      handler: saveRound.bind(null, masters)
    }
  }
}
