var shortid = require('shortid')

function list(templates, blocked_ip, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  blocked_ip.getBlockedIPs().then(blocked_ips => {
    var html = templates.blocked_ip.list({
      user: req.user,
      blocked_ips: blocked_ips
    })

    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var division_id = req.body.division_id
  var id = req.body.id ? req.body.id : shortid.generate()
  var p = req.body
  p.id = id
  p.captain_approved = p.captain_approved === 'on'
  p.statement = p.statement.slice(0, 500)
  p.is_draftable = p.is_draftable === 'on'

  player.savePlayer(p).then(() => {
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/players')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(blocked_ip, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var ip = req.body
  ip.address = req.body.ip_address
  ip.id = shortid.generate()

  blocked_ip.saveBlockedIP(ip).then(() => {
    res.redirect('/blocked_ip')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(blocked_ip, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var id = req.params.id

  blocked_ip.deleteBlockedIP(id).then(() => {
    res.redirect('/blocked_ip')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, blocked_ip) => {
  return {
    list: {
      route: '/blocked_ip',
      handler: list.bind(null, templates, blocked_ip)
    },
    post: {
      route: '/blocked_ip/edit',
      handler: post.bind(null, blocked_ip)
    },
    create: {
        route: '/blocked_ip/create',
        handler: create.bind(null, blocked_ip)
    },
    remove: {
      route: '/blocked_ip/:id/delete',
      handler: remove.bind(null, blocked_ip)
    }
  }
}
