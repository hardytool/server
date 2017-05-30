function getIndexPage(req, res) {
  var html = 404
  if (req.user) {
    html = `
      <div>Hey ` + req.user.profile.displayName + `!</div>
      <br>
      <div>
        <a href="/register">Register</a>
      </div>
      <br>
      <div>
        <a href="/logout">Log out</a>
      </div>
      `
  } else {
    html = `
      <div>Hey there!</div>
      <br>
      <div>
        <a href="/auth/steam">Log in</a>
      </div>
      `
  }

  res.send(html)
}

module.exports = getIndexPage
