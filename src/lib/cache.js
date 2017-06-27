var pairingMaps = require('./pairing-maps')

function initialize(season, team, series, pairings) {
  return season.getActiveSeason().then(season => {
    return team.getTeams(season.id).then(teams => {
      return series.getSeries({
          season_id: season.id
      }).then(series => {
        pairings.prefetch(
          season.id,
          season.current_round,
          teams,
          pairingMaps.mapSeries(series))
      })
    })
  })
}

module.exports = (season, team, series, pairings) => {
  return {
    initialize: initialize.bind(null, season, team, series, pairings)
  }
}
