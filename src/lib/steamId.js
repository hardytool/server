const BigNumber = require('bignumber.js')

function from64to32(id) {
  const id64 = new BigNumber(id)
  const diff = new BigNumber('76561197960265728')
  const id32 = id64.minus(diff)
  return id32
}

function from32to64(id) {
  const id32 = new BigNumber(id)
  const diff = new BigNumber('76561197960265728')
  const id64 = id32.plus(diff)
  return id64
}

module.exports = {
  from64to32: from64to32,
  from32to64: from32to64
}
