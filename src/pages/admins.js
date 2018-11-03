function create(templates, division, admin_group, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  division.getDivisions().then(divisions => {
    return admin_group.getAdminGroups().then(admin_groups => {
      const html = templates.admin.edit({
        user: req.user,
        verb: 'Create',
        divisions: divisions,
        admin_groups: admin_groups,
        csrfToken: req.csrfToken()
      })

      res.send(html)
    })
  })
}

function list(templates, admin, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  admin.getAdmins().then(admins => {
    const html = templates.admin.list({
      user: req.user,
      admins: admins
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function edit(templates, admin, division, admin_group, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const steam_id = req.params.admin_id

  admin.getAdmins({ steam_id: steam_id }).then(([admin]) => {
    return division.getDivisions().then(divisions => {
      return admin_group.getAdminGroups().then((admin_groups) => {
        const html = templates.admin.edit({
          user: req.user,
          verb: 'Edit',
          admin: admin,
          divisions: divisions,
          admin_groups: admin_groups,
          csrfToken: req.csrfToken()
        })
        res.send(html)
      }).catch(err => {
        console.error(err)
        res.sendStatus(500)
      })
    })
  })
}

function post(admin, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  if (req.body.division_id == '') {
    req.body.division_id = null
  }

  admin.saveAdmin(req.body).then(() => {
    res.redirect('/admins')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(admin, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  admin.deleteAdmin(req.body.steam_id).then(() => {
    res.redirect('/admins')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, admin, division, admin_group) => {
  return {
    create: {
      route: '/admins/create',
      handler: create.bind(null, templates, division, admin_group)
    },
    list: {
      route: '/admins',
      handler: list.bind(null, templates, admin)
    },
    edit: {
      route: '/admins/:admin_id/edit',
      handler: edit.bind(null, templates, admin, division, admin_group)
    },
    post: {
      route: '/admins/edit',
      handler: post.bind(null, admin)
    },
    remove: {
      route: '/admins/delete',
      handler: remove.bind(null, admin)
    }
  }
}
