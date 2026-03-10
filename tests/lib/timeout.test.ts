import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import timeout from '../../src/lib/timeout'

describe('timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const cases = [
    { delay: 100, description: '100ms' },
    { delay: 0, description: '0ms' },
    { delay: 5000, description: '5000ms' },
  ]

  it.each(cases)('resolves after $description', async ({ delay }) => {
    let resolved = false
    const promise = timeout(delay).then(() => { resolved = true })

    expect(resolved).toBe(false)
    await vi.advanceTimersByTimeAsync(delay)
    await promise
    expect(resolved).toBe(true)
  })
})
