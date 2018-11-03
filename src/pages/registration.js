var shortid = require('shortid')

function view(templates, season, division, steam_user, player, role, player_role, mmr, profile, req, res) {
  var season_id = req.params.season_id
  var division_id = req.params.division_id

  season.getSeason(season_id).then(season => {
    if (!req.user) {
      return templates.error.unauthenticated({
        user: req.user,
        error: `Please log in to be able to register for ${season.name}`
      })
    }

    return division.getDivision(division_id).then(division => {
      if (!division.active) {
        return templates.error.division_inactive({
          user: req.user,
          error: `${division.name} is inactive, registration is unavailable.`
        })
      }
      return steam_user.getSteamUser(req.user.steamId).then(steamUser => {
        return player.getPlayers({
          season_id: season.id,
          division_id: division.id,
          steam_id: steamUser.steam_id
        }).then(([player]) => {
          return role.getRoles().then(roles => {
            if (player) {
              return player_role.getRoleRanks({
                player_id: player.id
              }).then(ranks => {
                var prefs = roles.reduce((acc, role) => {
                  var rank = ranks.filter(r => r.role_id === role.id)
                  if (rank.length) {
                    acc[role.id] = rank[0].rank
                  }
                  return acc
                }, {})
                return templates.registration.edit({
                  user: req.user,
                  steamUser: steamUser,
                  division: division,
                  season: season,
                  player: player,
                  roles: roles,
                  ranks: prefs,
                  csrfToken: req.csrfToken()
                })
              })
            }

            return mmr.getMMR(steamUser.steam_id).then(({ rank }) => {
              if (!rank) {
                return templates.error.no_mmr({
                  user: req.user
                })
              }

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

                  return templates.registration.edit({
                    user: req.user,
                    season: season,
                    division: division,
                    steamUser: steamUser,
                    player: profile,
                    roles: roles,
                    ranks: [],
                    csrfToken: req.csrfToken()
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
      })
    })
  }).then(html => {
    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function shortcut(templates, season, division, steam_user, player, role, player_role, mmr, profile, req, res) {
  season.getActiveSeason().then(_season => {
    req.params.season_id = _season.id
    return view(templates, season, division, steam_user, player, role, player_role, mmr, profile, req, res)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function directory(templates, season, division, steam_user, player, req, res) {
  var season_id = req.params.season_id

  season.getSeason(season_id).then(season => {
    if (!req.user) {
      return templates.error.unauthenticated({
        user: req.user,
        error: `Please log in to be able to register for ${season.name}`
      })
    }

    return division.getDivisions({ active: true }).then(divisions => {
      if (divisions.length === 0) {
        return templates.error.no_divisions({
          user: req.user,
          error: 'There don\'t appear to be any active divisions. Ping an admin.'
        })
      }

      return steam_user.getSteamUser(req.user.steamId).then(steamUser => {
        return player.getPlayers({
          season_id: season.id,
          steam_id: steamUser.steam_id
        }).then(players => {
          divisions = divisions
            .map(d => {
              d.registered = players.map(p => p.division_id).includes(d.id)
              return d
            })
          return templates.registration.directory({
            user: req.user,
            season: season,
            divisions: divisions
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

function directoryShortcut(templates, season, division, steam_user, player, req, res) {
  season.getActiveSeason().then(_season => {
    req.params.season_id = _season.id
    return directory(templates, season, division, steam_user, player, req, res)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(templates, season, division, steam_user, team_player, player, role, player_role, profile, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var division_id = req.body.division_id
  var id = req.body.id ? req.body.id : shortid.generate()
  var p = req.body

  p.id = id
  p.steam_id = req.user.steamId
  p.captain_approved = false
  p.activity_check = false
  p.statement = p.statement.slice(0, 500)
  p.is_draftable = !(p.standin_only === 'on')
  delete p.standin_only

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      if (division.active) {
        return steam_user.getSteamUser(req.user.steamId).then(steamUser => {
          return profile.getProfile(steamUser.steam_id).then(_profile => {
            _profile.discord_name = req.body.discord_name
            return team_player.isCaptainAutoApproved(steamUser.steam_id)
            .then(({ allowed }) => {
              p.captain_approved = allowed
              return player.getPlayer(p.id).then(pl => {
                //stops overwrite of new captains when they edit registration
                p.captain_approved = pl.captain_approved

                p.activity_check = pl.activity_check
                // If a player signs up after activity checks are live, mark them fine for the check
                if (season.activity_check == true) {
                  p.activity_check = true
                }

                // If the player ID exists and the steam ID matches, allowed
                // If the player ID exists and the steam ID doesn't match, not allowed
                return pl.steam_id === req.user.steamId
              }).catch(() => {
                // If the player ID doesn't exist, action allowed
                return true
              }).then(allowed => {
                if (allowed) {
                  // If a player signs up after activity checks are live, mark them fine for the check
                  if (season.activity_check == true) {
                    p.activity_check = true
                  }
                  return player.savePlayer(p).then(() => {
                    return profile.saveProfile(_profile).then(() => {
                      return role.getRoles().then(roles => {
                        var promises = roles.reduce((promises, role) => {
                          if (p[role.id] !== undefined) {
                            promises.push(player_role.saveRoleRank(p.id, role.id, p[role.id]))
                          }
                          return promises
                        }, [])
                        return Promise.all(promises).then(() => {
                          var html = templates.registration.discord({
                            user: req.user,
                            season: season,
                            division: division
                          })

                          res.send(html)
                        })
                      })
                    })
                  })
                } else {
                  Promise.reject('Access forbidden')
                }
              })
            })
          })
        })
      } else {
        return Promise.reject('Division inactive')
      }
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function unregister(season, division, steam_user, player, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  var seasonId = req.body.season_id
  var divisionId = req.body.division_id
  var steamId = req.user.steamId

  season.getSeason(seasonId).then(season => {
    return division.getDivision(divisionId).then(division => {
      return steam_user.getSteamUser(steamId).then(steamUser => {
        return player.unregisterPlayer(season.id, division.id, steamUser.steam_id).then(() => {
            res.redirect('/seasons/' + season.id + '/divisions/' + division.id + '/players')
        })
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, season, division, steam_user, team_player, player, role, player_role, mmr, profile) => {
    return {
      view: {
        route: '/seasons/:season_id/divisions/:division_id/register',
        handler: view.bind(null, templates, season, division, steam_user, player, role, player_role, mmr, profile)
      },
      shortcut: {
        route: '/divisions/:division_id/register',
        handler: shortcut.bind(null, templates, season, division, steam_user, player, role, player_role, mmr, profile)
      },
      directory: {
        route: '/seasons/:season_id/register',
        handler: directory.bind(null, templates, season, division, steam_user, player)
      },
      directoryShortcut: {
        route: '/register',
        handler: directoryShortcut.bind(null, templates, season, division, steam_user, player)
      },
      post: {
        route: '/register',
        handler: post.bind(null, templates, season, division, steam_user, team_player, player, role, player_role, profile)
      },
      unregister: {
        route: '/register/delete',
        handler: unregister.bind(null, season, division, steam_user, player)
      }
    }
  }
