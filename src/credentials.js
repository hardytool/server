var fs = require('fs')

function credentials(config) {
  return {
    key: fs.readFileSync(config.ssl_key, 'utf8'),
    cert: fs.readFileSync(config.ssl_crt, 'utf8')
  }
}

module.exports = credentials
