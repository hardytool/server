function home(templates, req, res) {
  var html = templates.index({ user: req.user })

  res.send(html)
}

function complaint(templates, req, res) {
  var html = templates.complaint({user: req.user})

  res.send(html)
}

module.exports = templates => {
  return {
    home: {
      route: '/',
      handler: home.bind(null, templates)
    },
    complaint: {
      route: '/complaint',
      handler: complaint.bind(null, templates)
    }
  }
}
