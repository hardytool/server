const shortid = require('shortid')

async function list(templates, masters, req, res) {
  const seasons = await masters.getSeasons()

  const html = templates.masters.seasons.list({
    user: req.user,
    seasons: seasons,
  })

  res.send(html)
}

function create(templates, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const html = templates.masters.seasons.edit({
    user: req.user,
    verb: 'Create',
    csrfToken: req.csrfToken()
  })

  res.send(html)
}

async function edit(templates, masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const id = req.params.id
  const season = await masters.getSeason(id)

  const html = templates.masters.seasons.edit({
    user: req.user,
    verb: 'Edit',
    season: season,
    csrfToken: req.csrfToken()
  })

  res.send(html)
}

async function post(masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season = req.body
  const id = season.id ? season.id : shortid.generate()
  season.id = id
  season.active = season.active === 'on' ? true : false
  season.registration_open = season.registration_open === 'on' ? true : false

  await masters.saveSeason(season)
  res.redirect('/masters/seasons')
}

async function remove(masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  await masters.deleteSeason(req.body.id)
  res.redirect('/masters/seasons')
}

module.exports = (templates, masters) => {
  return {
    list: {
      route: '/masters/seasons',
      handler: list.bind(null, templates, masters)
    },
    create: {
      route: '/masters/seasons/create',
      handler: create.bind(null, templates),
    },
    edit: {
      route: '/masters/seasons/:id/edit',
      handler: edit.bind(null, templates, masters),
    },
    post: {
      route: '/masters/seasons/edit',
      handler: post.bind(null, masters)
    },
    remove: {
      route: '/masters/seasons/delete',
      handler: remove.bind(null, masters)
    }
  }
}
