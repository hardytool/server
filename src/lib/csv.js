const json2csv = require('json2csv')

function toCSV(records) {
  if (!records.length) {
    return new Promise('')
  }

  var fields = {
    data: records,
    fields: Object.keys(records[0])
  }

  return new Promise(function(resolve, reject) {
    json2csv(fields, function(err, csv) {
      if (err) {
        reject(err)
      }
      resolve(csv)
    })
  })
}

module.exports = {
  toCSV: toCSV
}
