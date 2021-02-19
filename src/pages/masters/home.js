const home = (templates, masters, req, res) => {
  const html = templates.masters.home({
    user: req.user
  })

  return res.send(html)
}

module.exports = (templates, masters) => {
  return {
    home: {
      route: '/masters',
      handler: home.bind(null, templates, masters)
    }
  }
}
