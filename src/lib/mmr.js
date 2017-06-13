var available = false

function getMMR(dota2, id, cb) {
  if (!available) {
    cb(new Error('DotA 2 client not running'), null)
    return
  }
  dota2.requestProfileCard(id, function(err, result) {
    if (err) {
      cb(err, null)
    }

    var soloSlot = result.slots.filter(slot => {
      return slot.stat && slot.stat.stat_id === 1
    })
    var partySlot = result.slots.filter(slot => {
      return slot.stat && slot.stat.stat_id === 2
    })
    var solo = soloSlot.length === 1 ? soloSlot[0].stat.stat_score : 0
    var party = partySlot.length === 1 ? partySlot[0].stat.stat_score : 0
    cb(null, {
      solo: solo,
      party: party
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
