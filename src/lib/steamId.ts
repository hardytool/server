import BigNumber from 'bignumber.js'

export function from64to32(id: string): BigNumber {
  const id64 = new BigNumber(id)
  const diff = new BigNumber('76561197960265728')
  return id64.minus(diff)
}

export function from32to64(id: string | number): BigNumber {
  const id32 = new BigNumber(id)
  const diff = new BigNumber('76561197960265728')
  return id32.plus(diff)
}
