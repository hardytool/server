var shortid = require('shortid')

function view(templates, season, steam_user, player, mmr, profile, req, res) {
  var season_id = req.params.season_id

  season.getSeason(season_id).then(season => {
    if (!season.registration_open) {
      return templates.error.registration_closed({
        user: req.user,
        error: `Registration for ${season.name} is closed.`
      })
    }

    if (!req.user) {
      return templates.error.unauthenticated({
        user: req.user,
        error: `Please log in to be able to register for ${season.name}`
      })
    }

    return steam_user.getSteamUser(req.user.steamId).then(steamUser => {
      return player.getPlayers({
        season_id: season.id,
        steam_id: steamUser.steam_id
      }).then(([player]) => {
        if (player) {
          return templates.registration.edit({
            user: req.user,
            steamUser: steamUser,
            season: season,
            player: player
          })
        }

        return mmr.getMMR(steamUser.steam_id).then(({ solo, party, rank }) => {
          if (!rank) {
            return templates.error.no_mmr({
              user: req.user,
            })
          }

          steamUser.solo_mmr = solo
          steamUser.party_mmr = party
          steamUser.rank = rank
          return steam_user.saveSteamUser(steamUser).then(() => {
            return profile.getProfile(steamUser.steam_id).then(profile => {
              profile = profile || {}
              profile.name = profile.name || steamUser.name
              profile.adjusted_mmr = profile.adjusted_mmr
                || (steamUser.solo_mmr > steamUser.party_mmr
                  ? steamUser.solo_mmr
                  : steamUser.party_mmr)
              profile.adjusted_rank = profile.adjusted_rank
                || steamUser.rank
              profile.is_draftable = profile.is_draftable === undefined
                ? true
                : profile.is_draftable

              console.dir(player)

              return templates.registration.edit({
                user: req.user,
                season: season,
                steamUser: steamUser,
                player: profile
              })
            })
          })
        }).catch(() => {
          return templates.error.dota_client_down({
            user: req.user
          })
        })
      })
    })
  }).then(html => {
    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function shortcut(
  templates, season, steam_user, player, mmr, profile, req, res) {
  if (!req.params) {
    req.params = {}
  }
  season.getActiveSeason().then(_season => {
    req.params.season_id = _season.id
    return view(templates, season, steam_user, player, mmr, profile, req, res)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(templates, season, steam_user, team_player, player, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var id = req.body.id ? req.body.id : shortid.generate()
  var p = req.body
  p.id = id
  p.steam_id = req.user.steamId
  p.captain_approved = false
  p.statement = p.statement.slice(0, 500)
  p.is_draftable = !(p.standin_only === 'on')
  delete p.standin_only

  season.getSeason(season_id).then(season => {
    return steam_user.getSteamUser(req.user.steamId).then(steamUser => {
      return team_player.isCaptainAutoApproved(steamUser.steam_id)
      .then(({ allowed }) => {
        p.captain_approved = allowed
        return player.savePlayer(p).then(() => {
          //res.redirect('/seasons/' + season.id + '/players')
          var html = templates.registration.discord({
            user: req.user,
            season: season
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

function unregister(season, steam_user, player, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  var seasonId = req.body.season_id
  var steamId = req.user.steamId
  season.getSeason(seasonId).then(season => {
    return steam_user.getSteamUser(steamId).then(steamUser => {
      return player.unregisterPlayer(season.id, steamUser.steam_id).then(() => {
          res.redirect('/seasons/' + season.id + '/players')
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports =
  (templates, season, steam_user, team_player, player, mmr, profile) => {
    return {
      view: {
        route: '/seasons/:season_id/register',
        handler: view.bind(
          null, templates, season, steam_user, player, mmr, profile)
      },
      shortcut: {
        route: '/register',
        handler: shortcut.bind(
          null, templates, season, steam_user, player, mmr, profile)
      },
      post: {
        route: '/register',
        handler: post.bind(
          null, templates, season, steam_user, team_player, player)
      },
      unregister: {
        route: '/register/delete',
        handler: unregister.bind(null, season, steam_user, player)
      }
    }
  }
