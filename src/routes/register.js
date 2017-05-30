var sql = require('pg-sql').sql

function getRegistrationForm(req, res) {
  if (!req.user) {
    res.redirect('/')
    return
  }

  var html = `
  <form method="POST" action="/register">
    <h3>Are you sure you want to register for this?</h3>
    <div>Seriously, consider what you're about to do.</div>
    <br>
    <div>
      <button>Confirm</button>
    </div>
  </form>`

  res.send(html)
}

function register(req, res) {
  res.redirect('/')
}

var routes = {
  form: getRegistrationForm,
  register: register
}

module.exports = routes
