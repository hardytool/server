const request = require('request')
const heroes = require('../assets/heroes.json')

function view(
  templates, steam_user, profile, season, vouch, team_player, steamId, player, req, res) {
  let viewerHasPlayed = Promise.resolve(null)
  if (req.user) {
    viewerHasPlayed = steam_user.getSteamUser(req.user.steamId)
      .then(viewer => {
        return team_player.hasPlayed(viewer.steam_id)
      })
  }
  viewerHasPlayed.then(viewerHasPlayed => {
    return request({
      url: 'https://api.opendota.com/api/players/' + req.params.steam_id + '/heroes?date=180',
      json: true
    }, function (error, response, body) {

      const top5 = body.length ? body.slice(0,5) : []
      const notableHeroes = top5.map(hero => {
        hero.picture =
            'https://steamcdn-a.akamaihd.net/apps/dota2/images/heroes/' +
            heroes[hero['hero_id']]['name'].substr(14) + '_sb.png'
        hero.localName = heroes[hero['hero_id']]['localized_name']
        return hero
      })

      return season.getActiveSeason().then(active_season => {
        return profile.getProfile(req.params.steam_id).then(_profile => {
          _profile.id64 = steamId.from32to64(_profile.steam_id)
                  return player.hasFalseActivity(active_season.id, _profile.steam_id).then(numberFalseActivity => {
            return team_player.hasPlayed(_profile.steam_id)
              .then(({ has_played }) => {
                return vouch.isVouched(_profile.steam_id)
                  .then(result => {
                    return team_player.getPlayerTeams(_profile.steam_id)
                      .then(teamsPlayed => {
                        return profile.getProfile(result.voucher_id).then(voucher => {
                          result.voucher = voucher
                          result.teamsPlayed = teamsPlayed
                          return result
                        })
                      }).then(({ is_vouched, voucher, teamsPlayed }) => {
                        const description = `RD2L Player ${_profile.name}
                        Adjusted MMR: ${_profile.adjusted_mmr}, Draft MMR: ${_profile.draft_mmr}
                        Played on team(s): ${teamsPlayed.map(x=>x.name).join(", ")}.`;
                        const html = templates.profile.view({
                          description: description,
                          user: req.user,
                          profile: _profile,
                          active_season: active_season,
                          vouched: is_vouched,
                          voucher: voucher,
                          has_played: has_played,
                          teamsPlayed: teamsPlayed,
                          numSeasonsFalseActivity: numberFalseActivity.count,
                          csrfToken: req.csrfToken(),
                          notableHeroes: notableHeroes,
                          can_vouch: (req.user && req.user.isAdmin)
                            || (viewerHasPlayed && viewerHasPlayed.has_played)
                        })
                        res.send(html)
                      })
                  })
              })
          })
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
  const steamId = req.params.steam_id

  const themes = ['default', 'darkly', 'pulse', 'superhero', 'solar']

  steam_user.getSteamUser(steamId).then(steamUser => {
    if (!(req.user.isAdmin || req.user.steamId === steamUser.steam_id)) {
      res.sendStatus(403)
      return
    }

    return profile.getProfile(steamUser.steam_id).then(profile => {
      const html = templates.profile.edit({
        user: req.user,
        steamUser: steamUser,
        profile: profile,
        themes: themes,
        csrfToken: req.csrfToken()
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

  const p = {}
  p.steam_id = req.body.steam_id
  p.name = req.body.name
  p.faceit_name = req.body.faceit_name
  p.discord_name = req.body.discord_name
  p.adjusted_mmr = Number.parseInt(req.body.adjusted_mmr)
  p.name_locked = req.body.name_locked === 'on'
  p.theme = req.body.theme

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

function vouch(templates, steam_user, profile, team_player, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  profile.getProfile(req.user.steamId).then(voucher => {
    return profile.getProfile(req.params.steam_id).then(vouchee => {
      return team_player.hasPlayed(voucher.steam_id).then(({ has_played }) => {
        if (has_played || req.user.isAdmin) {
          const html = templates.profile.vouch_confirm({
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

module.exports =
  (templates, steam_user, profile, season, team_player, _vouch, steamId, player) => {
    return {
      view: {
        route: '/profile/:steam_id',
        handler: view.bind(
          null, templates, steam_user, profile, season, _vouch, team_player, steamId, player)
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
