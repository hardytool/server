import { describe, it, expect } from 'vitest'
import wait from '../../src/lib/wait'

describe('wait', () => {
  it('returns true', () => {
    expect(wait()).toBe(true)
  })
})
