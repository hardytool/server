const shortid = require('shortid')

function create(templates, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const html = templates.banned_player.edit({
    user: req.user,
    verb: 'Create',
    csrfToken: req.csrfToken()
  })

  res.send(html)

}

function list(templates, banned_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  banned_player.getBannedPlayers().then(bannedPlayers => {
    const html = templates.banned_player.list({
      user: req.user,
      banned_players: bannedPlayers
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function edit(templates, banned_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const banned_player_id = req.params.id

  banned_player.getBannedPlayers({ banned_player_id: banned_player_id }).then(([bannedPlayer]) => {
    const html = templates.banned_player.edit({
      user: req.user,
      verb: 'Edit',
      banned_players: bannedPlayer,
      csrfToken: req.csrfToken()
    })
    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(banned_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const id = req.body.id ? req.body.id : shortid.generate()

  if (req.body.still_banned == null) {
    req.body.still_banned = false
  }

  req.body.id = id;

  banned_player.saveBannedPlayer(req.body).then(() => {
    res.redirect('/banned_players')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(banned_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  banned_player.deleteBannedPlayer(req.body.id).then(() => {
    res.redirect('/banned_players')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, banned_player) => {
  return {
    create: {
      route: '/banned_players/create',
      handler: create.bind(null, templates)
    },
    list: {
      route: '/banned_players',
      handler: list.bind(null, templates, banned_player)
    },
    edit: {
      route: '/banned_players/:id/edit',
      handler: edit.bind(null, templates, banned_player)
    },
    post: {
      route: '/banned_players/edit',
      handler: post.bind(null, banned_player)
    },
    remove: {
      route: '/banned_players/delete',
      handler: remove.bind(null, banned_player)
    }
  }
}
