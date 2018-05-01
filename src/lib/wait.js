var timeout = require('./timeout')

function wait(delay, condition){
  return timeout(delay).then(() => {
    if (condition()) {
      return true
    } else {
      return wait(delay, condition)
    }
  })
}

module.exports = wait
