var shortid = require('shortid')

function list(templates, admin_group, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  admin_group.getAdminGroups().then(admin_groups => {
    var html = templates.admin_group.list({
      user: req.user,
      admin_groups: admin_groups
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, admin_group, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  admin_group.getAdminGroupNames().then((admin_groups) => {
    var html = templates.admin_group.edit({
      user: req.user,
      verb: 'Create',
      admin_groups: admin_groups
    })

    res.send(html)
  })
}

function edit(templates, admin_group, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var admin_group_id = req.params.admin_group_id

  admin_group.getAdminGroups({ admin_group_id: admin_group_id }).then(([selected_admin_group]) => {
    return admin_group.getAdminGroupNames().then((admin_groups) => {
      var html = templates.admin_group.edit({
        user: req.user,
        verb: 'Edit',
        selected_admin_group: selected_admin_group,
        admin_groups: admin_groups
      })

      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(admin_group, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var id = req.body.id ? req.body.id : shortid.generate()
  var r = req.body
  r.id = id

  if (req.body.owner_id == '') {
    req.body.owner_id = null
  }

  admin_group.saveAdminGroup(req.body).then(() => {
    res.redirect('/admin_groups')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(admin_group, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var id = req.body.id

  admin_group.deleteAdminGroup(id).then(() => {
    res.redirect('/admin_groups')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, admin_group) => {
  return {
    list: {
      route: '/admin_groups',
      handler: list.bind(null, templates, admin_group)
    },
    create: {
      route: '/admin_groups/create',
      handler: create.bind(null, templates, admin_group)
    },
    edit: {
      route: '/admin_groups/:admin_group_id/edit',
      handler: edit.bind(null, templates, admin_group)
    },
    post: {
      route: '/admin_groups/edit',
      handler: post.bind(null, admin_group)
    },
    remove: {
      route: '/admin_groups/delete',
      handler: post.bind(null, remove)
    }
  }
}
