// Doesn't account for forfeits yet, still debating on that implementation
// for multi-point scenarios
function getModifiedMedianScores(options, round, participants, matches) {
  matches = matches.filter(match => match.round < round)
  var mappings = participants.reduce((acc, participant) => {
    acc.push(matches.filter(match => {
      return match.home.id === participant.id ||
        match.away.id === participant.id
    }).reduce((acc, match) => {
      if (match.home.id === participant.id) {
        acc.points += match.home.points
        acc.opponents.push(match.away.id)
      } else if (match.away.id === participant.id) {
        acc.points += match.away.points
        acc.opponents.push(match.home.id)
      }
      return acc
    }, { id: participant.id, points: 0, opponents: [] }))
    return acc
  }, [])
  var points = mappings.reduce((acc, val) => {
    acc[val.id] = val.points
    return acc
  }, {})
  var scores = mappings.reduce((acc, history) => {
    history.opponents.forEach(opponent => {
      // Don't calculate points for null (BYE) opponents
      if (opponent) {
        acc[opponent].scores.push(history.points)
        acc[opponent].points += history.points
      }
    })
    return acc
  }, participants.reduce((acc, participant) => {
    acc[participant.id] = {
      scores: [],
      points: 0
    }
    return acc
  }, {}))
  var fifty = ((round - 1) * options.maxPerRound) / 2
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

function getStandings(options, round, participants, matches) {
  matches = matches.filter(match => match.round < round)
  var scores = getModifiedMedianScores(
    options,
    round,
    participants,
    matches)
  var standings = participants.reduce((standings, participant) => {
    standings[participant.id] = {
      seed: participant.seed,
      wins: 0,
      losses: 0,
      tiebreaker: scores[participant.id]
    }
    return standings
  }, {})
  matches.forEach(match => {
    standings[match.home.id].wins += match.home.points
    standings[match.home.id].losses += match.away.points
    // Ignore null opponents/BYEs
    if (match.away.id) {
      standings[match.away.id].wins += match.away.points
      standings[match.away.id].losses += match.home.points
    }
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

function getMatchups(options, id, round, participants, matches) {
  matches = matches.filter(match => match.round < round)
  var standings = getStandings(options, round, participants, matches)
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
  var exclusions = participants.reduce((exclusions, participant) => {
    if (!exclusions.hasOwnProperty(participant.id)) {
      exclusions[participant.id] = [participant.id.toString()]
    }
    return exclusions
  }, {})

  exclusions = matches.reduce((exclusions, match) => {
    if (exclusions[match.home.id] &&
      !exclusions[match.home.id]
      .includes(match.away.id)) {
      if (match.away.id !== null) {
        exclusions[match.home.id].push(match.away.id.toString())
      }
    }
    if (exclusions[match.away.id] &&
      !exclusions[match.away.id]
      .includes(match.home.id)) {
      exclusions[match.away.id].push(match.home.id.toString())
    }
    return exclusions
  }, exclusions)


  var orderedParticipants = standings.map(s => {
    return {
      id: s.id,
      seed: participants.filter(participant => participant.id === s.id)[0].seed
    }
  })
  // Add BYE to the end of the list
  if (orderedParticipants.length % 2 === 1) {
    orderedParticipants.push({ id: null, seed: 0 })
  }
  var penalties = generatePenalties(options, orderedParticipants, matches)
  var matchups = standings.reduce((matchups, standing, i) => {
    var index = Math.floor(i/2)
    if (matchups[index]) {
      matchups[index].away = standing.id
    } else {
      matchups.push({
        home: standing.id
      })
    }
    return matchups
  }, [])
  matchups = minimizeMatchupPenalties(penalties, matchups)
  console.dir(matchups)
  return matchups
}

function minimizeMatchupPenalties(penalties, [head, next, ...tail]) {
  var ordered = findLowestPenalty(penalties, head, next)
  if (!tail.length) {
    return ordered
  } else {
    var remainder = minimizeMatchupPenalties(penalties, tail)
    return ordered.concat(remainder)
  }
}

function findLowestPenalty(penalties, m1, m2) {
  var options = [
    [
      {
        penalty: penalties[m1.home][m1.away] + penalties[m1.away][m1.home],
        home: m1.home,
        away: m1.away
      }, {
        penalty: penalties[m2.home][m2.away] + penalties[m2.away][m2.home],
        home: m2.home,
        away: m2.away
      }
    ], [
      {
        penalty: penalties[m1.home][m2.home] + penalties[m2.home][m1.home],
        home: m1.home,
        away: m2.home
      }, {
        penalty: penalties[m1.away][m2.away] + penalties[m1.away][m2.away],
        home: m1.away,
        away: m2.away
      }
    ], [
      {
        penalty: penalties[m1.home][m2.away] + penalties[m2.away][m1.home],
        home: m1.home,
        away: m2.away
      }, {
        penalty: penalties[m1.away][m2.home] + penalties[m1.away][m2.home],
        home: m1.away,
        away: m2.home
      }
    ]
  ]
  return options.sort(([a, b], [c, d]) => {
    return (a.penalty + b.penalty) - (c.penalty + d.penalty)
  })[0]
}

function generatePenalties(options, orderedParticipants, matches) {
  var penalties = orderedParticipants.map((participant, index) => {
    var opponents = orderedParticipants.slice()
    opponents.splice(index, 1)
    var penalties = opponents.map((opponent, idx) => {
      var penalty = matches.filter(match => {
        return (
          match.home.id === participant.id &&
          match.away.id === opponent.id
        ) || (
          match.home.id === opponent.id &&
          match.away.id === participant.id
        )
      }).length * options.rematchWeight
      penalty += ((index - idx) > 0 ? index - idx - 1 : idx - index) *
        options.standingWeight
      penalty += Math.abs(participant.seed - opponent.seed)
      return {
        id: opponent.id,
        penalty: penalty
      }
    })
    return {
      id: participant.id,
      penalties: penalties
    }
  })
  return penalties.reduce((acc, penaltyList) => {
    acc[penaltyList.id] = penaltyList.penalties.reduce((acc, penalty) => {
      acc[penalty.id] = penalty.penalty
      return acc
    }, {})
    return acc
  }, {})
}

module.exports = (options) => {
  if (!options) {
    options = {}
  }
  if (!options.maxPerRound) {
    options.maxPerRound = 1
  }
  if (!options.rematchWeight) {
    options.rematchWeight = 1000000
  }
  if (!options.standingWeight) {
    options.standingWeight = 10000
  }
  return {
    getModifiedMedianScores: getModifiedMedianScores.bind(null, options),
    getStandings: getStandings.bind(null, options),
    getMatchups: getMatchups.bind(null, options)
  }
}
