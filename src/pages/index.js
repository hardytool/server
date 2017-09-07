function home(templates, admin, req, res) {
  admin.getAdmins().then(admins => {
    var html = templates.index({
      user: req.user,
      admins: admins
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function complaint(templates, req, res) {
  var html = templates.complaint({user: req.user})

  res.send(html)
}

module.exports = (templates, admin) => {
  return {
    home: {
      route: '/',
      handler: home.bind(null, templates, admin)
    },
    complaint: {
      route: '/complaint',
      handler: complaint.bind(null, templates)
    }
  }
}
