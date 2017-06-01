var emoji = [...
  '🖕👌👍👎👋👏🙏💩🔫🤔' +
  '🔥🙄💯💦💖🚫❌👉👈👇' +
  '👆😏🚀⚓🍺🔪🗡️💕💘💤' +
  '✨💧💥🐴🐶🌈🌊☃️⛄😘' +
  '😉😐😑😥😮🤐😯😪😴😒' +
  '😓😕🙃😲😭😢😨😱😰😬' +
  '😡😠😳👺']

var alpha = [...
 '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_']

var alphaToEmojiMap = alpha.map((a, index) => {
  return [ a, emoji[index] ]
}).reduce((acc, cur) => {
  acc[cur[0]] = cur[1]
  return acc
}, {})

var emojiToAlphaMap = emoji.map((e, index) => {
  return [ e, alpha[index] ]
}).reduce((acc, cur) => {
  acc[cur[0]] = cur[1]
  return acc
}, {})

function emojify(id) {
  return id.split('').map(c => {
    return alphaToEmojiMap[c]
  }).join('')
}

function unemojify(id) {
  return id.split('').map(c => {
    return emojiToAlphaMap[c]
  }).join('')
}

module.exports = {
  emojify: emojify,
  unemojify: unemojify
}
