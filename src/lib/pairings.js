// Doesn't account for forfeits yet, still not sure how to implement that
function getModifiedMedianScores(
  maxPerRound, currentRound, teams, series) {
  var mappings = teams.reduce((acc, team) => {
    acc.push(series.filter(round => {
      return round.home.id === team.id ||
        round.away.id === team.id
    }).reduce((acc, round) => {
      if (round.home.id === team.id) {
        acc.points += round.home.points
        acc.opponents.push(round.away.id)
      } else if (round.away.id === team.id) {
        acc.points += round.away.points
        acc.opponents.push(round.home.id)
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
  }, teams.reduce((acc, team) => {
    acc[team.id] = {
      scores: [],
      points: 0
    }
    return acc
  }, {}))
  var fifty = ((currentRound - 1) * maxPerRound) / 2
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
}

function getStandings(maxPerRound, currentRound, teams, series) {
  var scores = getModifiedMedianScores(
    maxPerRound,
    currentRound,
    teams,
    series)
  var standings = teams.reduce((standings, team) => {
    standings[team.id] = {
      seed: team.seed,
      wins: 0,
      losses: 0,
      tiebreaker: scores[team.id]
    }
    return standings
  }, {})
  series.forEach(series => {
    standings[series.home.id].wins += series.home.points
    standings[series.home.id].losses += series.away.points
    standings[series.away.id].wins += series.away.points
    standings[series.away.id].losses += series.home.points
  })
  return Object.entries(standings).reduce((standings, [key, value]) => {
    standings.push({
      id: key,
      seed: value.seed,
      wins: value.wins,
      losses: value.losses,
      tiebreaker: value.tiebreaker
    })
    return standings
  }, []).sort((a, b) => {
    if (a.wins === b.wins) {
      if (a.tiebreaker === b.tiebreaker) {
        return b.seed - a.seed
      } else {
        return b.tiebreaker - a.tiebreaker
      }
    } else {
      return b.wins - a.wins
    }
  })
}

function getMatchups(maxPerRound, currentRound, teams, rounds) {
  var standings = getStandings(maxPerRound, currentRound, teams, rounds)
  standings.sort((a, b) => {
    if (a.wins === b.wins) {
      if (a.tiebreaker === b.tiebreaker) {
        return b.seed - a.seed
      } else {
        return b.tiebreaker - a.tiebreaker
      }
    } else {
      return b.wins - a.wins
    }
  })
  var exclusions = teams.reduce((exclusions, team) => {
    if (!exclusions.hasOwnProperty(team.id)) {
      exclusions[team.id] = [team.id]
    }
    return exclusions
  }, {})

  exclusions = rounds.reduce((exclusions, round) => {
    if (exclusions[round.home.id] &&
      !exclusions[round.home.id]
      .includes(round.away.id)) {
      exclusions[round.home.id].push(round.away.id)
    }
    if (exclusions[round.away.id] &&
      !exclusions[round.away.id]
      .includes(round.home.id)) {
      exclusions[round.away.id].push(round.home.id)
    }
    return exclusions
  }, exclusions)

  var orderedTeams = standings.map(s => {
    return s.id
  })
  // Add BYE to the end of the list
  orderedTeams.push(null)
  var matchups = standings.reduce((matchups, standing) => {
    // Don't match any teams that are already matched
    var matched = matchups.filter(matchup => {
      return matchup.home === standing.id ||
        matchup.away === standing.id
    }).length > 0
    if (matched) {
      return matchups
    }

    var opponent = orderedTeams.filter(id => {
      return !exclusions[standing.id].includes(id) &&
        matchups.filter(matchup => {
          return matchup.home === id ||
            matchup.away === id
        }).length === 0
    }).shift()
    // Highest seed is always the home team for now
    matchups.push({
      home: standing.id,
      away: opponent
    })
    return matchups
  }, [])
  return matchups
}

module.exports = (team, series, options) => {
  if (!options) {
    options = {}
  }
  if (!options.maxPerRound) {
    options.maxPerRound = 1
  }
  return {
    getModifiedMedianScores: getModifiedMedianScores.bind(
      null, options.maxPerRound),
    getStandings: getStandings.bind(null, options.maxPerRound),
    getMatchups: getMatchups.bind(null, options.maxPerRound)
  }
}
