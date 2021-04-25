const shortid = require('shortid')

async function list(templates, masters, req, res) {
  const divisions = await masters.getDivisions()

  const html = templates.masters.divisions.list({
    user: req.user,
    divisions: divisions
  })

  res.send(html)
}

async function view(templates, masters, req, res) {
  const division_id = req.params.division_id
  const division = await masters.getDivision(division_id)
  const seasons = await masters.getSeasons('DESC')

  const html = templates.masters.divisions.view({
    user: req.user,
    division: division,
    seasons: seasons
  })

  res.send(html)
}

function create(templates, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.SendStatus(403)
    return
  }

  const html = templates.masters.divisions.edit({
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

  const division = await masters.getDivision(id)
  const html = templates.masters.divisions.edit({
    user: req.user,
    verb: 'Edit',
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

  const division = req.body
  division.id = division.id ? division.id : shortid.generate()

  await masters.saveDivision(division)
  res.redirect('/masters/divisions')
}

async function remove(masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  await masters.deleteDivision(req.body.id)
  res.redirect('/masters/divisions')
}

module.exports = (templates, masters) => {
  return {
    list: {
      route: '/masters/divisions',
      handler: list.bind(null, templates, masters)
    },
    view: {
      route: '/masters/divisions/:division_id',
      handler: view.bind(null, templates, masters)
    },
    create: {
      route: '/masters/divisions/create',
      handler: create.bind(null, templates)
    },
    edit: {
      route: '/masters/divisions/:id/edit',
      handler: edit.bind(null, templates, masters)
    },
    post: {
      route: '/masters/divisions/edit',
      handler: post.bind(null, masters)
    },
    remove: {
      route: '/masters/divisions/delete',
      handler: remove.bind(null, masters)
    }
  }
}
