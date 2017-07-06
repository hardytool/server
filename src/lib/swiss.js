var blossom = require('edmonds-blossom')

// Doesn't account for forfeits yet, still debating on that implementation
// for multi-point scenarios
function getModifiedMedianScores(options, round, participants, matches) {
  matches = matches.filter(match => match.round < round)
  var mappings = getMappings(participants, matches)
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

function getMappings(participants, matches) {
  return participants.reduce((acc, participant) => {
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
    }, {
      id: participant.id,
      seed: participant.seed,
      points: 0,
      opponents: []
    }))
    return acc
  }, [])
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
  var mappings = getMappings(participants, matches)

  // because ids are strings but the blossom algorithm needs integers
  // we create maps from int-to-id then set the ids to integers
  var mapIds = new Map()
  var index = 0
  for (var m of mappings) {
    mapIds.set(index, m.id)
    m.id = index++
  }

  if(mappings.length % 2 === 1) {
    // we simulate the bye having played against every team with a bye
    // that way those teams will not get a bye again unless the matches are
    // ridiculously better if they have another
    // we also want it to bias toward giving byes to teams at the bottom
    // of the standings
    mappings.push({id: index,
      points:0,
      seed: 0,
      tiebreaker: 0,
      opponents:mappings.filter(m => {
        return m.opponents.length < round - 1
      }).map( m => {return m.id})
    })
    mapIds.set(index, null)
  }
  // to avoid repeatedly matching the same team up or down repeatedly
  // we shuffle the inputs to the blossom algorithm to counteract
  // any ordering biases it may have
  mappings = shuffle(mappings, round)
  var arr = mappings.reduce((arr, team, i, orig) => {
    var opps = orig.slice(0, i).concat(orig.slice(i + 1))
    for (var opp of opps) {
      arr.push([
          team.id,
          opp.id,
          -1 * (Math.pow(team.points - opp.points, options.standingPower) +
            options.rematchWeight * team.opponents.reduce((n, o) => {
              return n + (o === mapIds.get(opp.id))
            }, 0))
      ])
    }
    return arr
  }, [])

  var results = blossom(arr, true)
  var matchups = []
  // Here we sort matchups by standings so that matchups and standings follow
  // roughly the same order - this doesn't impact funcitonality at all
  // Ordering this in the view layer should be possible, so let's move it there
  // pending review
  var standings = getStandings(options, round, participants, matches)
  var sortedKeys = [...mapIds.keys()].sort((a, b) => {
    // Float BYEs to the end
    if (mapIds.get(a) === null) {
      return 1
    } else if (mapIds.get(b) === null) {
      return -1
    }
    return standings.findIndex(s => s.id === mapIds.get(a)) -
      standings.findIndex(s => s.id === mapIds.get(b))
  })
  for(var i of sortedKeys) {
    if(results[i] !== -1 && !matchups.reduce(
      (n, r) => n || r.home === mapIds.get(results[i]),
      false)) {
      matchups.push({
        home: mapIds.get(i),
        away: mapIds.get(results[i])
      })
    }
  }
  return matchups
}

// Knuth shuffle from stack overflow
function shuffle(array, seed) {
  var currentIndex = array.length

  // fast, seeded PRNG from stackoverflow
  var s = seed
   const random = () => {
    var x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  }

  while (0 !== currentIndex) {
    var randomIndex = Math.floor(random() * currentIndex--);
    var temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array
}

module.exports = (options) => {
  options = options || {}
  options.maxPerRound = options.maxPerRound || 1
  options.rematchWeight = options.rematchWeight || 100
  options.standingPower = options.standingPower || 2
  return {
    getModifiedMedianScores: getModifiedMedianScores.bind(null, options),
    getStandings: getStandings.bind(null, options),
    getMatchups: getMatchups.bind(null, options),
    getMappings: getMappings,
  }
}
