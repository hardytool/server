var Promise = require('bluebird')
var timeout = require('./timeout.js')
var available = false
var queued = 0

function getMMR(dota2, id) {
  if (!available) {
    return Promise.reject(new Error('DotA 2 client not running'))
  }
  return timeout(queued++ * 2000).then(() => {
    return new Promise((resolve, reject) => {
      dota2.requestProfileCard(id, function(err, result) {
        timeout(2000).then(() => {
          queued--
        })
        if (err) {
          reject(err)
        }

        var soloSlot = result.slots.filter(slot => {
          return slot.stat && slot.stat.stat_id === 1
        })
        var partySlot = result.slots.filter(slot => {
          return slot.stat && slot.stat.stat_id === 2
        })
        var solo = soloSlot.length === 1 ? soloSlot[0].stat.stat_score : null
        var party = partySlot.length === 1 ? partySlot[0].stat.stat_score : null
        resolve({
          solo: solo,
          party: party
        })
      })
    })
  })
}

function setAvailable(bool) {
  available = bool
}

module.exports = dota2 => {
  dota2._client.on('error', () => {
    setAvailable(false)
  })
  dota2.on('ready', () => {
    setAvailable(true)
  })

  return {
    getMMR: getMMR.bind(null, dota2)
  }
}
