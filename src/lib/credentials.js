var fs = require('fs')

module.exports = config => {
  if (config.ssl_key && config.ssl_cert && config.ssl_ca) {
    return {
      key: fs.readFileSync(config.ssl_key, 'utf8'),
      cert: fs.readFileSync(config.ssl_cert, 'utf8'),
      ca: fs.readFileSync(config.ssl_ca, 'utf8')
    }
  } else {
    return false
  }
}
