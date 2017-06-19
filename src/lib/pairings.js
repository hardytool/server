function getModifiedMedianScores(team, series, season_id, serial) {
  return team.getTeams(season_id).then(teams => {
    return series.getSeries({
      season_id: season_id,
      serial: serial
    }).then(series => {
      return teams.reduce((acc, team) => {
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
        }, { points: 0, opponents: [] }))
        return acc
      }, []).reduce((acc, history) => {
        history.opponents.forEach(opponent => {
          acc[opponent] = acc[opponent]
            ? acc[opponent] + history.points
            : history.points
        })
        return acc
      }, {})
    })
  })
}

function getMatchups(team, series, season_id, serial) {
  return team.getTeams(season_id).then(teams => {
    return series.getStandings(season_id, serial).then(standings => {
      return getModifiedMedianScores(
        team,
        series,
        season_id,
        serial
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
          serial: serial
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

module.exports = (team, series) => {
  return {
    getModifiedMedianScores: getModifiedMedianScores.bind(null, team, series),
    getMatchups: getMatchups.bind(null, team, series)
  }
}
