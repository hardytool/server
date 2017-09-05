function view(templates, steam_user, profile, vouch, team_player, req, res) {
  var viewerHasPlayed = Promise.resolve(null)
  if (req.user) {
    viewerHasPlayed = steam_user.getSteamUser(req.user.steamId).then(viewer => {
      return team_player.hasPlayed(viewer.steam_id)
    })
  }
  viewerHasPlayed.then(viewerHasPlayed => {
    return profile.getProfile(req.params.steam_id).then(_profile => {
      return team_player.hasPlayed(_profile.steam_id)
        .then(({ has_played }) => {
          return vouch.isVouched(_profile.steam_id)
            .then(result => {
              return profile.getProfile(result.voucher_id).then(voucher => {
                result.voucher = voucher
                return result
              })
            }).then(({ is_vouched, voucher }) => {
              var html = templates.profile.view({
                user: req.user,
                profile: _profile,
                vouched: is_vouched,
                voucher: voucher,
                has_played: has_played,
                can_vouch: (req.user && req.user.isAdmin)
                  || (viewerHasPlayed && viewerHasPlayed.has_played)
              })
              res.send(html)
            })
        })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function edit(templates, steam_user, profile, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }
  var steamId = req.params.steam_id

  steam_user.getSteamUser(steamId).then(steamUser => {
    if (!(req.user.isAdmin || req.user.steamId === steamUser.steam_id)) {
      res.sendStatus(403)
      return
    }

    return profile.getProfile(steamUser.steam_id).then(profile => {
      var html = templates.profile.edit({
        user: req.user,
        steamUser: steamUser,
        profile: profile
      })
      res.send(html)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(steam_user, profile, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  var p = {}
  p.steam_id = req.body.steam_id
  p.name = req.body.name
  p.adjusted_mmr = Number.parseInt(req.body.adjusted_mmr)
  p.name_locked = req.body.name_locked === 'on'

  steam_user.getSteamUser(p.steam_id).then(steamUser => {
    if (!(req.user.isAdmin || req.user.steamId === steamUser.steam_id)) {
      res.sendStatus(403)
      return
    }

    return profile.getProfile(steamUser.steam_id).then(_profile => {
      console.dir(_profile)
      if (!req.user.isAdmin) {
        p.adjusted_mmr = _profile ? _profile.adjusted_mmr : null
        p.name_locked = _profile ? _profile.name_locked : false
        if (p.name_locked) {
          p.name = _profile ? _profile.name : steamUser.name
        }
      }
      return profile.saveProfile(p).then(() => {
        res.redirect('/profile/' + p.steam_id)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function vouch(templates, steam_user, profile, team_player, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  profile.getProfile(req.user.steamId).then(voucher => {
    return profile.getProfile(req.params.steam_id).then(vouchee => {
      return team_player.hasPlayed(voucher.steam_id).then(({ has_played }) => {
        if (has_played || req.user.isAdmin) {
          var html = templates.profile.vouch_confirm({
            user: req.user,
            voucher: voucher,
            vouchee: vouchee,
          })
          res.send(html)
        } else {
          res.sendStatus(403)
        }
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function confirm(steam_user, profile, vouch, team_player, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  profile.getProfile(req.user.steamId).then(voucher => {
    return profile.getProfile(req.params.steam_id).then(vouchee => {
      return team_player.hasPlayed(voucher.steam_id).then(({ has_played }) => {
        if (has_played || req.user.isAdmin) {
          return vouch.vouch(voucher.steam_id, vouchee.steam_id).then(() => {
            res.redirect(`/profile/${vouchee.steam_id}`)
          })
        } else {
          res.sendStatus(403)
        }
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function unvouch(profile, vouch, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  profile.getProfile(req.params.steam_id).then(profile => {
    return vouch.unvouch(profile.steam_id).then(() => {
      res.redirect(`/profile/${profile.steam_id}`)
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, steam_user, profile, team_player, _vouch) => {
  return {
    view: {
      route: '/profile/:steam_id',
      handler: view.bind(
        null, templates, steam_user, profile, _vouch, team_player)
    },
    edit: {
      route: '/profile/:steam_id/edit',
      handler: edit.bind(null, templates, steam_user, profile)
    },
    post: {
      route: '/profile/edit',
      handler: post.bind(null, steam_user, profile)
    },
    vouch: {
      route: '/profile/:steam_id/vouch',
      handler: vouch.bind(null, templates, steam_user, profile, team_player)
    },
    confirm: {
      route: '/profile/:steam_id/confirm',
      handler: confirm.bind(null, steam_user, profile, _vouch, team_player)
    },
    unvouch: {
      route: '/profile/:steam_id/unvouch',
      handler: unvouch.bind(null, profile, _vouch)
    }
  }
}
