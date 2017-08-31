function view(templates, steam_user, profile, req, res) {
  var steamId = req.params.steam_id

  steam_user.getSteamUser(steamId).then(steamUser => {
    return profile.getProfile(steamUser.steam_id).then(profile => {
      profile = profile || {}
      profile.name = profile.name || steamUser.name
      profile.adjusted_mmr = profile.adjusted_mmr
        || (steamUser.solo_mmr > steamUser.party_mmr
          ? steamUser.solo_mmr
          : steamUser.party_mmr)
      var html = templates.profile.view({
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

module.exports = (templates, steam_user, profile) => {
  return {
    view: {
      route: '/profile/:steam_id',
      handler: view.bind(null, templates, steam_user, profile)
    },
    edit: {
      route: '/profile/:steam_id/edit',
      handler: edit.bind(null, templates, steam_user, profile)
    },
    post: {
      route: '/profile/edit',
      handler: post.bind(null, steam_user, profile)
    }
  }
}
