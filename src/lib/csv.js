const json2csv = require('json2csv').parse

function toCSV(records) {
  if (!records.length) {
    return new Promise('')
  }

  const fields = Object.keys(records[0])

  return new Promise(function(resolve, reject) {
    try {
      const csv = json2csv(records, { fields })
      resolve(csv)
    } catch(err) {
      reject(err)
    }
  })
}

module.exports = {
  toCSV: toCSV
}
