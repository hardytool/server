function list(templates, season, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  season.getSeasonList().then(seasons => {
    var html = templates.season.list({
      subtitle: 'Seasons List',
      seasons: seasons
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, season, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var html = templates.season.edit({
    subtitle: 'Create Season',
  })

  res.send(html)
}

function edit(templates, season, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var id = req.params.id

  season.getSeason(id).then(season => {
    var html = templates.season.edit({
      subtitle: `Edit Season ${season.number}`,
      seasons: [ season ]
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


  season.saveSeason(req.body).then(() => {
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
      handler: create.bind(null, templates, season),
    },
    edit: {
      route: '/seasons/edit/:id',
      handler: edit.bind(null, templates, season),
    },
    post: {
      route: '/seasons/edit',
      handler: post.bind(null, season)
    }
  }
}
