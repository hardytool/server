function steamIdReturn(config, req, res) {
  if (!config.server.website_url) {
    res.redirect('/')
  } else {
    res.redirect(config.server.website_url)
  }
}

function logout(config, req, res) {
  if (req.user) {
    req.logout()
  }

  if (!config.server.website_url) {
    res.redirect('/')
  } else {
    res.redirect(config.server.website_url)
  }
}

module.exports = config => {
  return {
    steamIdReturn: steamIdReturn.bind(null, config),
    logout: logout.bind(null, config)
  }
}
