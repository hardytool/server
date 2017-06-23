// Doesn't account for forfeits yet, still not sure how to implement that
function getModifiedMedianScores(
  team, series, maxPerRound, season_id, round) {
  if (!maxPerRound) {
    maxPerRound = 2
  }
  return team.getTeams(season_id).then(teams => {
    return series.getSeries({
      season_id: season_id,
      serial: round
    }).then(series => {
      var mappings = teams.reduce((acc, team) => {
        acc.push(series.filter(series => {
          return series.home_team_id === team.id ||
            series.away_team_id === team.id
        }).reduce((acc, series) => {
          if (series.home_team_id === team.id) {
            acc.points += series.home_points
            acc.opponents.push(series.away_team_id)
          } else if (series.away_team_id === team.id) {
            acc.points += series.away_points
            acc.opponents.push(series.home_team_id)
          }
          return acc
        }, { id: team.id, points: 0, opponents: [] }))
        return acc
      }, [])
      var points = mappings.reduce((acc, val) => {
        acc[val.id] = val.points
        return acc
      }, {})
      var scores = mappings.reduce((acc, history) => {
        history.opponents.forEach(opponent => {
          acc[opponent].scores.push(history.points)
          acc[opponent].points += history.points
        })
        return acc
      }, Object.entries(points).reduce((acc, [key]) => {
        acc[key] = {
          scores: [],
          points: 0
        }
        return acc
      }, {}))
      var fifty = ((round - 1) * maxPerRound) / 2
      return Object.entries(scores).reduce((acc, [key, value]) => {
        value.scores.sort()
        if (points[key] > fifty) {
          value.scores.shift()
        } else if (points[key] < fifty) {
          value.scores.pop()
        }
        acc[key] = value.scores.reduce((acc, val) => acc + val, 0)
        return acc
      }, {})
    })
  })
}

function getMatchups(team, series, maxPerRound, season_id, round) {
  return team.getTeams(season_id).then(teams => {
    return series.getStandings(season_id, round).then(standings => {
      return getModifiedMedianScores(
        team,
        series,
        maxPerRound,
        season_id,
        round
      ).then(scores => {
        return standings.sort((a, b) => {
          if (a.wins === b.wins) {
            if (scores[a.id] === scores[b.id]) {
              return b.seed - a.seed
            } else {
              return scores[b.id] - scores[a.id]
            }
          } else {
            return b.wins - a.wins
          }
        })
      }).then(standings => {
        return series.getSeries({
          season_id: season_id,
          serial: round
        }).then(series => {
          var exclusions = teams.reduce((acc, val) => {
            if (!acc.hasOwnProperty(val.id)) {
              acc[val.id] = [val.id]
            }
            return acc
          }, {})

          exclusions = series.reduce((exclusions, series) => {
            if (exclusions[series.home_team_id] &&
              !exclusions[series.home_team_id]
              .includes(series.away_team_id)) {
              exclusions[series.home_team_id].push(series.away_team_id)
            }
            if (exclusions[series.away_team_id] &&
              !exclusions[series.away_team_id]
              .includes(series.home_team_id)) {
              exclusions[series.away_team_id].push(series.home_team_id)
            }
            return exclusions
          }, exclusions)

          var orderedTeams = standings.map(s => {
            return s.id
          })
          // Add BYE to the end of the list
          orderedTeams.push(null)
          var matchups = standings.reduce((matchups, val) => {
            // Don't match any teams that are already matched
            var matched = matchups.filter(matchup => {
              return matchup.home_team_id === val.id ||
                matchup.away_team_id === val.id
            }).length > 0
            if (matched) {
              return matchups
            }

            var opponent = orderedTeams.filter(id => {
              return !exclusions[val.id].includes(id) &&
                matchups.filter(matchup => {
                  return matchup.home_team_id === id ||
                    matchup.away_team_id === id
                }).length === 0
            }).shift()
            // Highest seed is always the home team for now
            var home = val.id
            var away = opponent
            if (away !== undefined) {
              matchups.push({
                home_team_id: home,
                away_team_id: away
              })
            }
            return matchups
          }, [])
          matchups = matchups.map(matchup => {
            var home = teams.filter(team => {
              return team.id === matchup.home_team_id
            }).pop()
            var away = teams.filter(team => {
              return team.id === matchup.away_team_id
            }).pop()
            if (away === undefined) {
              away = {
                id: null,
                name: 'BYE',
                logo: null
              }
            }
            return {
              home: home,
              away: away
            }
          })
          return matchups
        })
      })
    })
  })
}

module.exports = (team, series, options) => {
  if (!options) {
    options = {}
  }
  if (!options.maxPerRound) {
    options.maxPerRound = 2
  }
  return {
    getModifiedMedianScores: getModifiedMedianScores.bind(
      null, team, series, options.maxPerRound),
    getMatchups: getMatchups.bind(
      null, team, series, options.maxPerRound)
  }
}
