function list(season, division, player, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  season.getSeason(season_id).then(_season => {
    return division.getDivision(division_id).then(_division => {
      return player.getPlayers({
        season_id: season_id,
        division_id: division_id,
        is_captain: false,
        is_standin: false,
        hide_captains: true,
        hide_standins: true
      }).then(players => {
        return player.getPlayers({
          season_id: season_id,
          division_id: division_id,
          is_captain: true
        }).then(captains => {
          const maxPlayers = captains.length * 4
          console.log('%d captains, %d max players', captains.length, maxPlayers)
          res.json({
            draftable: players.slice(0, maxPlayers),
            belowCutoff: players.slice(maxPlayers)
          })
        })
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function captains(season, division, player, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  let normal = true
  if (req.query.reverse_mmr && req.query.reverse_mmr == 'true') {
    normal = false
  }
  season.getSeason(season_id).then(_season => {
    return division.getDivision(division_id).then(_division => {
      return player.getPlayers({
        season_id: season_id,
        division_id: division_id,
        is_captain: true
      }, {
        by_mmr: normal,
        by_reverse_mmr: !normal
      }).then(captains => {
        res.json(captains)
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (season, division, player) => {
  return {
    list: {
      route: '/api/v1//seasons/:season_id/divisions/:division_id/players',
      handler: list.bind(null, season, division, player)
    },
    captains: {
      route: '/api/v1//seasons/:season_id/divisions/:division_id/captains',
      handler: captains.bind(null, season, division, player)
    }
  }
}