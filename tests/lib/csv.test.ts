import { describe, it, expect } from 'vitest'
import { toCSV } from '../../src/lib/csv'

describe('toCSV', () => {
  describe('empty input', () => {
    it('returns null for empty array', async () => {
      const result = await toCSV([])
      expect(result).toBeNull()
    })
  })

  describe('single record', () => {
    const cases = [
      {
        name: 'single field',
        input: [{ name: 'Alice' }],
        expectedHeader: '"name"',
        expectedData: '"Alice"',
      },
      {
        name: 'multiple fields',
        input: [{ name: 'Alice', age: 30 }],
        expectedHeader: '"name","age"',
        expectedData: '"Alice",30',
      },
      {
        name: 'boolean and null values',
        input: [{ active: true, deleted: null }],
        expectedHeader: '"active","deleted"',
        expectedData: 'true,',
      },
    ]

    it.each(cases)(
      '$name',
      async ({ input, expectedHeader, expectedData }) => {
        const result = await toCSV(input)
        expect(result).not.toBeNull()
        const lines = result!.split('\n')
        expect(lines[0]).toBe(expectedHeader)
        expect(lines[1]).toContain(expectedData)
      }
    )
  })

  describe('multiple records', () => {
    const cases = [
      {
        name: '2 records produce header + 2 rows',
        input: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        expectedLineCount: 3,
      },
      {
        name: '3 records produce header + 3 rows',
        input: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' },
        ],
        expectedLineCount: 4,
      },
    ]

    it.each(cases)(
      '$name',
      async ({ input, expectedLineCount }) => {
        const result = await toCSV(input)
        expect(result).not.toBeNull()
        const lines = result!.split('\n')
        expect(lines).toHaveLength(expectedLineCount)
      }
    )
  })

  describe('special characters', () => {
    const cases = [
      {
        name: 'commas in values are quoted',
        input: [{ note: 'hello, world' }],
        expected: '"hello, world"',
      },
      {
        name: 'quotes in values are escaped',
        input: [{ note: 'say "hi"' }],
        expected: '"say ""hi"""',
      },
      {
        name: 'newlines in values are quoted',
        input: [{ note: 'line1\nline2' }],
        expected: '"line1\nline2"',
      },
    ]

    it.each(cases)(
      'handles $name',
      async ({ input, expected }) => {
        const result = await toCSV(input)
        expect(result).toContain(expected)
      }
    )
  })
})
