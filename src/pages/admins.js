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

module.exports = (templates, admin) => {
  return {
    list: {
      route: '/admins',
      handler: list.bind(null, templates, admin)
    }
  }
}
