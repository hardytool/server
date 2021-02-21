const shortid = require('shortid')

async function list(templates, masters, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)
  const teams = await masters.getTeams(season_id, division_id)

  const html = templates.masters.teams.list({
    user: req.user,
    season: season,
    division: division,
    teams: teams
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

  const html = templates.masters.teams.edit({
    user: req.user,
    verb: 'Create',
    season: season,
    division: division,
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
  const team = await masters.getTeam(id)

  const html = templates.masters.teams.edit({
    user: req.user,
    verb: 'Edit',
    team: team,
    season: season,
    division: division,
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
  const team = req.body
  team.id = id
  team.approved = !!team.approved

  await masters.saveTeam(team)
  res.redirect('/masters/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + team.id)
}

async function remove(masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id

  await masters.deleteTeam(id)
  res.redirect('/masters/seasons/' + season_id + '/divisions/' + division_id + '/teams')
}

module.exports = (templates, masters) => {
  return {
    list: {
      route: '/masters/seasons/:season_id/divisions/:division_id/teams',
      handler: list.bind(null, templates, masters)
    },
    create: {
      route: '/masters/seasons/:season_id/divisions/:division_id/teams/create',
      handler: create.bind(null, templates, masters)
    },
    edit: {
      route: '/masters/seasons/:season_id/divisions/:division_id/teams/:id/edit',
      handler: edit.bind(null, templates, masters)
    },
    post: {
      route: '/masters/teams/edit',
      handler: post.bind(null, masters)
    },
    remove: {
      route: '/masters/teams/delete',
      handler: remove.bind(null, masters)
    }
  }
}
