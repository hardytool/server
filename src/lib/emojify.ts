const emoji: string[] = [
  ...'🖕👌👍👎👋👏🙏💩🔫🤔' +
  '🔥🙄💯💦💖🚫❌👉👈👇' +
  '👆😏🚀⚓🍺🔪💕💘💤🙌' +
  '✨💧💥🐴🐶🌈🌊💀⛄😘' +
  '😉😐😑😥😮🤐😯😪😴😒' +
  '😓😕🙃😲😭😢😨😱😰😬' +
  '😡😠😳👺'
]

const alpha: string[] = [
  ...'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
]

const alphaToEmojiMap: Record<string, string> = alpha.reduce<Record<string, string>>((acc, a, index) => {
  acc[a] = emoji[index]
  return acc
}, {})

const emojiToAlphaMap: Record<string, string> = emoji.reduce<Record<string, string>>((acc, e, index) => {
  acc[e] = alpha[index]
  return acc
}, {})

export function emojify(id: string): string {
  return [...id].map(c => alphaToEmojiMap[c]).join('')
}

export function unemojify(id: string): string {
  return [...id].map(c => emojiToAlphaMap[c]).join('')
}
