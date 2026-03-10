import { describe, it, expect } from 'vitest'
import { from64to32, from32to64 } from '../../src/lib/steamId'

describe('steamId', () => {
  describe('from64to32', () => {
    const cases = [
      { input: '76561197960265728', expected: '0' },
      { input: '76561197960265729', expected: '1' },
      { input: '76561198078205517', expected: '117939789' },
      { input: '76561198049763533', expected: '89497805' },
      { input: '76561198060329985', expected: '100064257' },
    ]

    it.each(cases)(
      'converts $input to 32-bit ID $expected',
      ({ input, expected }) => {
        expect(from64to32(input).toString()).toBe(expected)
      }
    )
  })

  describe('from32to64', () => {
    const cases: { input: string | number; expected: string }[] = [
      { input: '0', expected: '76561197960265728' },
      { input: 1, expected: '76561197960265729' },
      { input: '117939789', expected: '76561198078205517' },
      { input: 89497805, expected: '76561198049763533' },
      { input: '100064257', expected: '76561198060329985' },
    ]

    it.each(cases)(
      'converts $input to 64-bit ID $expected',
      ({ input, expected }) => {
        expect(from32to64(input).toString()).toBe(expected)
      }
    )
  })

  describe('roundtrip', () => {
    const ids64 = [
      '76561197960265728',
      '76561198078205517',
      '76561198049763533',
      '76561198060329985',
    ]

    it.each(ids64)('roundtrips 64->32->64 for %s', (id) => {
      const id32 = from64to32(id)
      const back = from32to64(id32.toString())
      expect(back.toString()).toBe(id)
    })

    const ids32 = [0, 1, 117939789, 89497805]

    it.each(ids32)('roundtrips 32->64->32 for %s', (id) => {
      const id64 = from32to64(id)
      const back = from64to32(id64.toString())
      expect(back.toNumber()).toBe(id)
    })
  })
})
