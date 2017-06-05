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
    if (soloSlot.length !== 1 || partySlot.length !== 1) {
      cb({ error: 'MMR not display' }, null)
    } else {
      cb(null, {
        solo: soloSlot[0].stat.stat_score,
        party: partySlot[0].stat.stat_score
      })
    }
  })
}

module.exports = dota2 => {
  return {
    available: available,
    getMMR: getMMR.bind(null, dota2)
  }
}
