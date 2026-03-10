import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import interval from '../../src/lib/interval'

describe('interval', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves when callback calls resolve', async () => {
    let callCount = 0
    const promise = interval(100, (resolve) => {
      callCount++
      if (callCount >= 3) resolve()
    })

    await vi.advanceTimersByTimeAsync(100)
    expect(callCount).toBe(1)

    await vi.advanceTimersByTimeAsync(100)
    expect(callCount).toBe(2)

    await vi.advanceTimersByTimeAsync(100)
    await promise
    expect(callCount).toBe(3)
  })

  it('passes resolve and reject to callback', () => {
    const callback = vi.fn()
    interval(50, callback)

    vi.advanceTimersByTime(50)
    expect(callback).toHaveBeenCalledWith(expect.any(Function), expect.any(Function))
  })
})
