function home(auth, req, res) {
  var html = null
  var profile = req.user.profile
  if (req.user) {
    html = `
    <style type="text/css">
      #name {
        display: inline-block;
        vertical-align: middle;
      }
      #avatar {
        display: inline-block;
        vertical-align: middle;
        height: 1.25em;
      }
    </style>
    <div>
      <span id="name">Hey ${profile.displayName}!</span>
      <img id="avatar" src="${auth.getAvatar(profile)}">
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

module.exports = auth => {
  return {
    home: {
      route: '/',
      handler: home.bind(null, auth)
    }
  }
}
