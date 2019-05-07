const shortid = require('shortid')

function list(templates, season, division, team, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeams(season_id, division_id).then(teams => {
        const html = templates.team.list({
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

  const season_id = req.params.season_id
  const division_id = req.params.division_id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      const html = templates.team.edit({
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

  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const id = req.params.id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeam(id).then(team => {
        const html = templates.team.edit({
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

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id ? req.body.id : shortid.generate()
  const t = req.body
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

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id

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
      const promises = teams.map(_team => {
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

function importTeams(team, season, division, player, req, res) {
  // Can't run if you are not an admin
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  return season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return player.getPlayers({
        season_id: season_id,
        division_id: division_id,
        is_captain: true
      }).then(captains => {
        const promises = captains.map(_captain => {
          const toSave = {}
          toSave.id = shortid.generate()
          toSave.season_id = season_id
          toSave.division_id = division_id
          toSave.name = _captain.name
          toSave.logo = ''
          toSave.standin_count = 0
          toSave.team_number = null
          toSave.disbanded = false
          toSave.seed = getRandomInt(captains.length * 10)
          return team.saveTeam(toSave)
        })

        return Promise.all(promises).then(() => {
          res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/teams')
        })
      })
    })
  })
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = (templates, season, division, team, team_player, player) => {
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
    },
    importTeams: {
      route: '/seasons/:season_id/divisions/:division_id/teams/import',
      handler: importTeams.bind(null, team, season, division, player)
    }
  }
}
