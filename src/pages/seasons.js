var emojify = require('../lib/emojify')
var shortid = require('shortid')

function list(templates, season, req, res) {
  season.getSeasons().then(seasons => {
    seasons = seasons.map(season => {
      season.vanity = emojify.emojify(season.id)
      return season
    })
    var html = templates.season.list({
      user: req.user,
      seasons: seasons
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var html = templates.season.edit({
    user: req.user,
    verb: 'Create'
  })

  res.send(html)
}

function edit(templates, season, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var id = emojify.unemojify(req.params.id)

  season.getSeason(id).then(season => {
    var html = templates.season.edit({
      user: req.user,
      verb: 'Edit',
      season: season
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(season, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var s = req.body
  var id = s.id ? s.id : shortid.generate()
  s.id = id
  s.active = s.active == 'on' ? true : false

  season.saveSeason(s).then(() => {
    res.redirect('/seasons')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(season, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  season.deleteSeason(req.body.id).then(() => {
    res.redirect('/seasons')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, season) => {
  return {
    list: {
      route: '/seasons',
      handler: list.bind(null, templates, season)
    },
    create: {
      route: '/seasons/create',
      handler: create.bind(null, templates),
    },
    edit: {
      route: '/seasons/edit/:id',
      handler: edit.bind(null, templates, season),
    },
    post: {
      route: '/seasons/edit',
      handler: post.bind(null, season)
    },
    remove: {
      route: '/seasons/delete',
      handler: remove.bind(null, season)
    }
  }
}
