const Promise = require('bluebird')
let available = false

function getMMR(dota2, id) {
  if (!available) {
    return Promise.reject(new Error('DotA 2 client not running'))
  }
  return new Promise((resolve, reject) => {
    dota2.requestProfileCard(id, function(err, result) {
      if (err) {
        reject(err)
      }

      const soloSlot = result.slots.filter(slot => {
        return slot.stat && slot.stat.stat_id === 1
      })
      const partySlot = result.slots.filter(slot => {
        return slot.stat && slot.stat.stat_id === 2
      })
      const solo = soloSlot.length === 1 ? soloSlot[0].stat.stat_score : null
      const party = partySlot.length === 1 ? partySlot[0].stat.stat_score : null
      const rank = result.rank_tier
      const previous_rank = result.previous_rank_tier ? result.previous_rank_tier : 0
      resolve({
        solo: solo,
        party: party,
        rank: rank,
        previous_rank: previous_rank
      })
    })
  })
}

function setAvailable(bool) {
  available = bool
}

function isAvailable() {
  return available
}

module.exports = dota2 => {
  dota2._client.on('error', () => {
    setAvailable(false)
  })
  dota2.on('ready', () => {
    setAvailable(true)
  })

  return {
    getMMR: getMMR.bind(null, dota2),
    isAvailable: isAvailable
  }
}
