var shortid = require('shortid')
var csv = require('../lib/csv')

function list(templates, season, division, player, req, res) {
  var includeCaptains = req.query.includeCaptains === '1'
    || req.query.includeCaptains === 'true'
    ? true
    : false
  var includeStandins = req.query.includeStandins === '1'
    || req.query.includeStandins === 'true'
    ? true
    : false
  var season_id = req.params.season_id
  var division_id = req.params.division_id
  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return player.getPlayers({
        season_id: season_id,
        division_id: division_id,
        is_captain: false,
        is_standin: false,
        hide_captains: !includeCaptains,
        hide_standins: !includeStandins
      }).then(players => {
        return player.getPlayers({
          season_id: season_id,
          division_id: division_id,
          is_captain: true
        }).then(captains => {
          var html = templates.player.list({
            user: req.user,
            season: season,
            division: division,
            players: players,
            noun: 'Players',
            cutoff: captains.length * 5
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

function captains(templates, season, division, player, req, res) {
  var season_id = req.params.season_id
  var division_id = req.params.division_id
  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return player.getPlayers({
        season_id: season_id,
        division_id: division_id,
        is_captain: true
      }, {
        by_mmr: true
      }).then(players => {
        var html = templates.player.captains({
          user: req.user,
          season: season,
          division: division,
          players: players
        })

        res.send(html)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function standins(templates, season, division, player, req, res) {
  var season_id = req.params.season_id
  var division_id = req.params.division_id
  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return player.getPlayers({
        season_id: season_id,
        division_id: division_id,
        is_standin: true
      }, {
        by_mmr: true
      }).then(players => {
        var html = templates.player.standins({
          user: req.user,
          season: season,
          division: division,
          players: players
        })

        res.send(html)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function create(templates, season, division, steam_user, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id
  var division_id = req.params.division_id

  season.getSeason(season_id).then(season => {
    return division.getDivisions().then(divisions => {
      return division.getDivision(division_id).then(division => {
        return steam_user.getNonPlayerSteamUsers(season.id, division_id).then(steamUsers => {
          var html = templates.player.edit({
            user: req.user,
            verb: 'Create',
            season: season,
            division: division,
            divisions: divisions,
            steamUsers: steamUsers,
            csrfToken: req.csrfToken()
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

function edit(templates, season, division, player, steam_user, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.params.season_id
  var division_id = req.params.division_id
  var id = req.params.id

  season.getSeason(season_id).then(season => {
    return division.getDivisions().then(divisions => {
      return division.getDivision(division_id).then(division => {
        return player.getPlayer(id).then(player => {
          var html = templates.player.edit({
            user: req.user,
            verb: 'Edit',
            player: player,
            season: season,
            division: division,
            divisions: divisions,
            csrfToken: req.csrfToken()
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

function remove(player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  var season_id = req.body.season_id
  var division_id = req.body.division_id
  var id = req.body.id

  player.deletePlayer(id).then(() => {
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/players')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function getCSV(player, player_role, role, division, req, res) {
  var isCaptains = req.query.captains === '1' ? true : false
  var hideCaptains = req.query.show_captains === '1' ? false : true
  var byMMR = req.query.by_mmr === '1' ? true : false
  var division_id = req.params.division_id

  player.getDraftSheet({
    season_id: req.params.season_id,
    division_id: division_id,
    is_captain: isCaptains,
    hide_captains: hideCaptains && !isCaptains
  }, {
    by_mmr: isCaptains || byMMR
  }).then(players => {
    return player_role.getRoleRanks().then(roleRanks => {
      return role.getRoles().then(roles => {
        return division.getDivision(division_id).then(divisions => {
          players = players.map(player => {
            var playerRoleRanks = roleRanks.filter(rr => rr.player_id === player.id)
              .reduce((acc, rr) => {
                acc[rr.role_id] = rr.rank
                return acc
              }, {})
            var o = roles.reduce((acc, role) => {
              acc['Role: ' + role.name] = playerRoleRanks[role.id]
              return acc
            }, {})
            var rank = player.draft_rank
            player.draft_rank = ((rank - (rank % 10))/10 - 1) * 5 + (rank % 10)
            delete player.id
            return Object.assign(player, o)
          })
          return csv.toCSV(players).then(csv => {
            var filename = divisions.name.toLowerCase() + '-'
            if (isCaptains) {
              filename += 'captains'
            } else {
              filename += 'players'
            }
            filename += '.csv'
            res.setHeader('Content-Type', 'text/csv')
            res.setHeader('Content-Disposition', 'attachment; filename=' + filename)
            res.end(csv)
          })
        })
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function activityCheck(player, season, req, res) {
  season.getActiveSeason().then(_season => {
    var steam_id
    if (req.params.steam_id) {
      if (!req.user || !req.user.isAdmin) {
        res.sendStatus(403)
        return
      }
      steam_id = req.params.steam_id
    } else {
      steam_id = req.user.steamId
    }

    player.activityCheck(_season.id, steam_id).then(() => {
      res.redirect('/profile/' + steam_id)
    }).catch(err => {
      console.error(err)
      res.sendStatus(500)
    })
  })
}

function json(player, req, res) {
  player.getPlayers().then(players => {
    res.send(players)
  })
}

module.exports = (templates, season, division, player, player_role, role, steam_user) => {
  return {
    list: {
      route: '/seasons/:season_id/divisions/:division_id/players',
      handler: list.bind(null, templates, season, division, player)
    },
    captains: {
      route: '/seasons/:season_id/divisions/:division_id/captains',
      handler: captains.bind(null, templates, season, division, player)
    },
    standins: {
      route: '/seasons/:season_id/divisions/:division_id/stand-ins',
      handler: standins.bind(null, templates, season, division, player)
    },
    create: {
      route: '/seasons/:season_id/divisions/:division_id/players/create',
      handler: create.bind(null, templates, season, division, steam_user),
    },
    edit: {
      route: '/seasons/:season_id/divisions/:division_id/players/:id/edit',
      handler: edit.bind(null, templates, season, division, player, steam_user),
    },
    post: {
      route: '/players/edit',
      handler: post.bind(null, player)
    },
    remove: {
      route: '/players/delete',
      handler: remove.bind(null, player)
    },
    csv: {
      route: '/seasons/:season_id/divisions/:division_id/draftsheet',
      handler: getCSV.bind(null, player, player_role, role, division)
    },
    activityCheck: {
      route: '/players/activityCheck',
      handler: activityCheck.bind(null, player, season)
    },
    activityCheckAdmin: {
      route: '/players/activityCheck/:steam_id',
      handler: activityCheck.bind(null, player, season)
    },
    json: {
      route: '/players/json',
      handler: json.bind(null, player)
    }
  }
}
