var BigNumber = require('bignumber.js')

function from64to32(id) {
  var id64 = new BigNumber(id)
  var diff = new BigNumber('76561197960265728')
  var id32 = id64.minus(diff)
  return id32
}

function from32to64(id) {
  var id32 = new BigNumber(id)
  var diff = new BigNumber('76561197960265728')
  var id64 = id32.plus(diff)
  return id64
}

module.exports = {
  from64to32: from64to32,
  from32to64: from32to64
}
