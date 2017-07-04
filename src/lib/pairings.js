var Promise = require('bluebird')

var pairs = {}
var matchups = {}
var _participants = null
var _matches = null

function prefetch(options, id, round, participants, matches) {
  _participants = participants
  _matches = matches

  if (!pairs[id]) {
    pairs[id] = new Promise(resolve => {
        resolve([...getAllPairs(participants.map(p => p.id))])
    })
    matchups[id] = {}
    var i = round + 1
    matchups[id][i] = prepareMatchups(
        options,
        id,
        i,
        participants,
        matches)
  }
}

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

function getMatchups(options, id, round) {
  if (matchups[id]) {
    if (!matchups[id][round]) {
      matchups[id][round] = new Promise(resolve => {
        resolve(prepareMatchups(
          options,
          id,
          round,
          _participants,
          _matches))
      })
    }
  }
  return matchups[id][round].then(matchups => {
    return JSON.parse(JSON.stringify(matchups))
  })
}

function prepareMatchups(options, id, round, participants, matches) {
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
  var best = null
  return pairs[id].then(pairs => {
    for (var [, list] of pairs.entries()) {
      var option = list.map(([home, away]) => {
        var penalty = penalties[home][away] + penalties[away][home]
        return {
          penalty: penalty,
          home: home,
          away: away
        }
      }).reduce((option, pair) => {
        if (option.penalty === undefined) {
          option.penalty = 0
        }
        if (option.matchups === undefined) {
          option.matchups = []
        }
        option.penalty += pair.penalty
        option.matchups.push(pair)
        return option
      }, {})
      if (!best || option.penalty < best.penalty) {
        best = option
      }
    }
    best.matchups.sort((a, b) => {
      return standings.findIndex(el => el.id === a.home) -
        standings.findIndex(el => el.id === b.home)
    })
    return best.matchups
  })
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

function* getAllPairs(participants) {
  if (participants.length < 2) {
    yield [participants]
    return
  }

  var a = participants[0]
  participants = participants.slice(1)
  for (var [i, val] of participants.entries()) {
    var pair = [a, val]
    var others = participants.slice(0, i).concat(participants.slice(i+1))
    if (others.length === 0) {
      yield [pair]
    } else {
      for (var rest of getAllPairs(others)) {
        yield [pair].concat(rest)
      }
    }
  }
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
    prefetch: prefetch.bind(null, options),
    getModifiedMedianScores: getModifiedMedianScores.bind(
      null, options),
    getStandings: getStandings.bind(null, options),
    getMatchups: getMatchups.bind(null, options),
    getAllPairs: getAllPairs
  }
}
