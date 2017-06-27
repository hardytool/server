function mapSeries(series) {
  return series.map(series => {
    return {
      round: series.round,
      home: {
        id: series.home_team_id,
        points: series.home_points
      },
      away: {
        id: series.away_team_id,
        points: series.away_points
      }
    }
  })
}

module.exports = {
  mapSeries: mapSeries
}
