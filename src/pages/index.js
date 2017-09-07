function home(templates, admin, steamId, req, res) {
  admin.getAdmins().then(admins => {
    admins.map(admin => {
      admin.id64 = steamId.from32to64(admin.steam_id)
      return admin
    })
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

module.exports = (templates, admin, steamId) => {
  return {
    home: {
      route: '/',
      handler: home.bind(null, templates, admin, steamId)
    },
    complaint: {
      route: '/complaint',
      handler: complaint.bind(null, templates)
    }
  }
}
