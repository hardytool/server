var available = false
var Promise = require('bluebird')

function getMMR(dota2, id) {
  if (!available) {
    return Promise.reject(new Error('DotA 2 client not running'))
  }
  return new Promise((resolve, reject) => {
    dota2.requestProfileCard(id, function(err, result) {
      if (err) {
        reject(err)
      }

      var soloSlot = result.slots.filter(slot => {
        return slot.stat && slot.stat.stat_id === 1
      })
      var partySlot = result.slots.filter(slot => {
        return slot.stat && slot.stat.stat_id === 2
      })
      var solo = soloSlot.length === 1 ? soloSlot[0].stat.stat_score : 0
      var party = partySlot.length === 1 ? partySlot[0].stat.stat_score : 0
      resolve({
        solo: solo,
        party: party
      })
    })
  })
}

function setAvailable(bool) {
  available = bool
}

module.exports = dota2 => {
  return {
    setAvailable: setAvailable,
    getMMR: getMMR.bind(null, dota2)
  }
}
