const emoji = [...
  '🖕👌👍👎👋👏🙏💩🔫🤔' +
  '🔥🙄💯💦💖🚫❌👉👈👇' +
  '👆😏🚀⚓🍺🔪💕💘💤🙌' +
  '✨💧💥🐴🐶🌈🌊💀⛄😘' +
  '😉😐😑😥😮🤐😯😪😴😒' +
  '😓😕🙃😲😭😢😨😱😰😬' +
  '😡😠😳👺']

const alpha = [...
 '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_']

const alphaToEmojiMap = alpha.map((a, index) => {
  return [ a, emoji[index] ]
}).reduce((acc, cur) => {
  acc[cur[0]] = cur[1]
  return acc
}, {})

const emojiToAlphaMap = emoji.map((e, index) => {
  return [ e, alpha[index] ]
}).reduce((acc, cur) => {
  acc[cur[0]] = cur[1]
  return acc
}, {})

function emojify(id) {
  return [...id].map(c => {
    return alphaToEmojiMap[c]
  }).join('')
}

function unemojify(id) {
  return [...id].map(c => {
    return emojiToAlphaMap[c]
  }).join('')
}

module.exports = {
  emojify: emojify,
  unemojify: unemojify
}
