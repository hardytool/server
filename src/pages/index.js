const fs = require('fs')
const md = new require('markdown-it')({
  linkify: true
})
const classy = require('markdown-it-classy')
md.use(classy)

function home(templates, req, res) {
  const html = templates.index({
    user: req.user
  })

  res.send(html)
}

function complaint(templates, req, res) {
  const html = templates.complaint({user: req.user})

  res.send(html)
}

function rules(templates, path, req, res) {
  fs.readFile(path, 'utf8', (err, data) => {
    const rules = md.render(data)
    const html = templates.rules({
      user: req.user,
      rules: rules
    })

    res.send(html)
  })
}

function playoffs(templates, req, res) {
  const html = templates.playoffs({
    user: req.user
  })

  res.send(html)
}

module.exports = (templates, path, irulespath) => {
  return {
    home: {
      route: '/',
      handler: home.bind(null, templates)
    },
    complaint: {
      route: '/complaint',
      handler: complaint.bind(null, templates)
    },
    rules: {
      route: '/rules',
      handler: rules.bind(null, templates, path)
    },
    irules: {
      route: '/inhouserules',
      handler: rules.bind(null, templates, irulespath)
    },
    playoffs: {
      route: '/playoffs',
      handler: playoffs.bind(null, templates)
    }
  }
}
