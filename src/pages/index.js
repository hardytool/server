function home(templates, auth, req, res) {
  var user = null
  if (req.user) {
    user = req.user.profile
    user.avatar = auth.getAvatar(user)
    user.isAdmin = req.user.isAdmin
  }

  var html = templates.index({ user: user })

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
