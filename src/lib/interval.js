const Promise = require('bluebird')

module.exports = (delay, f) => {
  return new Promise((resolve, reject) => {
    setInterval(f, delay, resolve, reject)
  })
}
