var shortid = require('shortid')

function list(templates, role, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  role.getRoles().then(roles => {
    var html = templates.role.list({
      user: req.user,
      roles: roles
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var html = templates.role.edit({
    user: req.user,
    verb: 'Create',
    csrfToken: req.csrfToken()
  })

  res.send(html)
}

function edit(templates, role, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var role_id = req.params.role_id

  role.getRoles({ role_id: role_id }).then(([role]) => {
    var html = templates.role.edit({
      user: req.user,
      verb: 'Edit',
      role: role,
      csrfToken: req.csrfToken()
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(role, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var id = req.body.id ? req.body.id : shortid.generate()
  var r = req.body
  r.id = id

  role.saveRole(req.body).then(() => {
    res.redirect('/roles')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(role, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var id = req.body.id

  role.deleteRole(id).then(() => {
    res.redirect('/roles')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, role) => {
  return {
    list: {
      route: '/roles',
      handler: list.bind(null, templates, role)
    },
    create: {
      route: '/roles/create',
      handler: create.bind(null, templates)
    },
    edit: {
      route: '/roles/:role_id/edit',
      handler: edit.bind(null, templates, role)
    },
    post: {
      route: '/roles/edit',
      handler: post.bind(null, role)
    },
    remove: {
      route: '/roles/delete',
      handler: post.bind(null, remove)
    }
  }
}
