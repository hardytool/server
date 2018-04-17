var shortid = require('shortid')

function list(templates, admin, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  admin.getAdmins().then(admins => {
    var html = templates.admin.list({
      user: req.user,
      admins: admins
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function edit(templates, admin, division, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var admin_id = req.params.admin_id

  admin.getAdmins({ admin_id: admin_id }).then(([admin]) => {
    division.getDivisions().then(divisions => {
        var html = templates.admin.edit({
          user: req.user,
          verb: 'Edit',
          admin: admin,
          divisions: divisions
        })

        res.send(html)
      }).catch(err => {
        console.error(err)
        res.sendStatus(500)
      })
    })
}

function post(admin, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  if (req.body.division_id == '0') {
    req.body.division_id = null
  }

  admin.saveAdmin(req.body).then(() => {
    res.redirect('/admins')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, admin, division) => {
  return {
    list: {
      route: '/admins',
      handler: list.bind(null, templates, admin)
    },
    edit: {
      route: '/admins/:admin_id/edit',
      handler: edit.bind(null, templates, admin, division)
    },
    post: {
      route: '/admins/edit',
      handler: post.bind(null, admin)
    }
  }
}
