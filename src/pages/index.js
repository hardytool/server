function home(templates, auth, req, res) {
  var html = templates.index({ user: req.user })

  res.send(html)
}

module.exports = (templates, auth) => {
  return {
    home: {
      route: '/',
      handler: home.bind(null, templates, auth)
    }
  }
}
