async function list(templates, masters, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)

  const html = templates.masters.series.list({
    user: req.user,
    season: season,
    division: division,
    series: []
  })

  res.send(html)
}

function create(templates, masters, req, res) {
  res.sendStatus(404)
  return
}

function edit(templates, masters, req, res) {
  res.sendStatus(404)
  return
}

function post(series, req, res) {
  res.sendStatus(404)
  return
}

function remove(series, req, res) {
  res.sendStatus(404)
  return
}

function standings(templates, masters, req, res) {
  res.sendStatus(404)
  return
}

function matchups(templates, masters, req, res) {
  res.sendStatus(404)
  return
}

module.exports = (templates, masters) => {
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
      route: '/masters/seasons/:season_id/divisions/:division_id/standings/:round?',
      handler: standings.bind(null, templates, masters)
    },
    matchups: {
      route: '/masters/seasons/:season_id/divisions/:division_id/matchups/:round?',
      handler: matchups.bind(null, templates, masters)
    }
  }
}
