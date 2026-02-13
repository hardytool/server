type IntervalCallback = (
  resolve: () => void,
  reject: (err: unknown) => void
) => void

export default function interval(delay: number, f: IntervalCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    setInterval(f, delay, resolve, reject)
  })
}
