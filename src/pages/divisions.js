var shortid = require('shortid')

function list(templates, division, req, res) {
  division.getDivisions().then(divisions => {
    var html = templates.division.list({
      user: req.user,
      divisions: divisions
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function nav(templates, season, division, admin, req, res) {
  var division_id = req.params.division_id
  division.getDivision(division_id).then(division => {
    return admin.getDivisionAdmins(division_id).then(divisionAdmins => {
      return season.getActiveSeason().then(seasons => {
        var html = templates.division.division({
          user: req.user,
          division: division,
          seasons: seasons,
          divisionAdmins: divisionAdmins
        })

        res.send(html)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function all_seasons(templates, season, division, req, res) {
  var division_id = req.params.division_id
  division.getDivision(division_id).then(division => {
    return season.getSeasons().then(seasons => {
      var html = templates.division.all_seasons({
        user: req.user,
        division: division,
        seasons: seasons
      })

      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.SendStatus(403)
    return
  }

  var html = templates.division.edit({
    user: req.user,
    verb: 'Create'
  })

  res.send(html)
}

function edit(templates, division, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var id = req.params.id

  division.getDivision(id).then(division => {
    var html = templates.division.edit({
      user: req.user,
      verb: 'Edit',
      division: division
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(division, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var d = req.body
  var id = d.id ? d.id : shortid.generate()
  d.id = id
  d.active = d.active == 'on' ? true : false

  division.saveDivision(d).then(() => {
    res.redirect('/divisions')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(division, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  division.deleteDivision(req.body.id).then(() => {
    res.redirect('/divisions')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, season, division, admin) => {
  return {
    list: {
      route: '/divisions',
      handler: list.bind(null, templates, division)
    },
    nav: {
      route: '/divisions/:division_id',
      handler: nav.bind(null, templates, season, division, admin)
    },
    all_seasons: {
      route: '/divisions/:division_id/all_seasons',
      handler: all_seasons.bind(null, templates, season, division)
    },
    create: {
      route: '/divisions/create',
      handler: create.bind(null, templates)
    },
    edit: {
      route: '/divisions/:id/edit',
      handler: edit.bind(null, templates, division)
    },
    post: {
      route: '/divisions/edit',
      handler: post.bind(null, division)
    },
    remove: {
      route: '/divisions/delete',
      handler: remove.bind(null, division)
    }
  }
}
