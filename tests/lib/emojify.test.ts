import { describe, it, expect } from 'vitest'
import { emojify, unemojify } from '../../src/lib/emojify'

describe('emojify', () => {
  describe('emojify single characters', () => {
    const cases = [
      { input: '0', expected: '🖕' },
      { input: '9', expected: '🤔' },
      { input: 'a', expected: '🔥' },
      { input: 'z', expected: '🌈' },
      { input: 'A', expected: '🌊' },
      { input: 'Z', expected: '😠' },
      { input: '-', expected: '😳' },
      { input: '_', expected: '👺' },
    ]

    it.each(cases)(
      'maps "$input" to $expected',
      ({ input, expected }) => {
        expect(emojify(input)).toBe(expected)
      }
    )
  })

  describe('emojify multi-character strings', () => {
    it('converts a multi-char string to concatenated emoji', () => {
      const result = emojify('abc')
      expect(result).toBe(emojify('a') + emojify('b') + emojify('c'))
    })

    it('returns empty string for empty input', () => {
      expect(emojify('')).toBe('')
    })
  })

  describe('unemojify single characters', () => {
    const cases = [
      { input: '🖕', expected: '0' },
      { input: '🤔', expected: '9' },
      { input: '🔥', expected: 'a' },
      { input: '🌈', expected: 'z' },
      { input: '🌊', expected: 'A' },
      { input: '😠', expected: 'Z' },
      { input: '😳', expected: '-' },
      { input: '👺', expected: '_' },
    ]

    it.each(cases)(
      'maps $input back to "$expected"',
      ({ input, expected }) => {
        expect(unemojify(input)).toBe(expected)
      }
    )
  })

  describe('roundtrip', () => {
    const strings = ['0', 'abc', 'Hello', 'Test-_123', '0123456789', 'ZzAa']

    it.each(strings)('roundtrips "%s"', (str) => {
      expect(unemojify(emojify(str))).toBe(str)
    })
  })

  it('maps all 64 characters bijectively', () => {
    const alpha = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
    const emojified = emojify(alpha)
    const emojiChars = [...emojified]
    expect(new Set(emojiChars).size).toBe(64)
    expect(unemojify(emojified)).toBe(alpha)
  })
})
