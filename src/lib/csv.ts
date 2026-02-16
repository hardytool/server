import { Parser } from '@json2csv/plainjs'

export function toCSV(records: Record<string, unknown>[]): Promise<string | null> {
  if (!records.length) {
    return Promise.resolve(null)
  }

  const fields = Object.keys(records[0])

  return new Promise((resolve, reject) => {
    try {
      const csv = new Parser({ fields }).parse(records)
      resolve(csv)
    } catch (err) {
      reject(err)
    }
  })
}
