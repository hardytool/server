function list(req, res) {
  var html = 404
  if (!req.user) {
    res.send(403)
    return
  }

  res.send(html)
}

function edit(req, res) {
  var html = 404
  if (!req.user || !req.user.isAdmin) {
    res.send(403)
    return
  }

  res.send(html)
}

function post(req, res) {
  var html = 404
  if (!req.user || !req.user.isAdmin) {
    res.send(403)
    return
  }

  res.send(html)
}

module.exports = {
  list: list,
  edit: edit,
  post: post
}
