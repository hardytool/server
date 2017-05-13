function getRoster(req, res) {
  if (!req.user) {
    res.status(403).json({ error: 'Must be authenticated' })
    return
  }

  var team = {
    id: 'a5b8374d-e3a4-4eae-9d74-2739954d54ca',
    logo: 'https://riki.dotabuff.com/t/l/6LkyWxI7Et.png',
    name: 'Disburg Disblarg Disband',

    season: {
      id: '32657c99-6714-422d-988a-8cbc424ffbbd',
      name: 'Season 1',
      logo: 'https://raw.githubusercontent.com/seal-dota/seal-dota.github.io/master/seal.png'
    },

    captain: {
      id: '80eeb2e2-4015-4cea-a469-111c7b4d5fc7',
      name: 'Viuebabiurbehats',
      steam_id: '64908677',
      avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fa/facd65e8000505d06d78e01c756193974c6bc648_full.jpg'
    },

    players: [
      {
        id: '80eeb2e2-4015-4cea-a469-111c7b4d5fc7',
        name: 'Viuebabiurbehats',
        steam_id: '64908677',
        avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fa/facd65e8000505d06d78e01c756193974c6bc648_full.jpg'
      },
      {
        id: 'cf36797d-9f0f-4bd3-8325-4d8a6e4e2d87',
        name: 'Treebeard',
        steam_id: '95576973',
        avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/8e/8e58931e6ebdcba904a645f318d892a5fc9e54d2_full.jpg'
      },
      {
        id: 'd026fc2b-c3bd-4a27-9737-cba431197a8e',
        name: 'Clare ♥ atran đẹp trai quá ♥ A-R',
        steam_id: '102264839',
        avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/a2/a2913e7013742c440fc2da1e7bc071b92ca2d245_full.jpg'
      },
      {
        id: 'cd89476e-e2c3-415d-81e1-32132b23c437',
        name: 'aTran',
        steam_id: '18433518',
        avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/48/48a980cb816542ab80c8a22a07a6e12e5ffba454_full.jpg'
      },
      {
        id: '1e0d5dca-88d6-42c3-a645-36891f97cfa0',
        name: 'Fallen',
        steam_id: '127264062',
        avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/e8/e854bc7dcb8562a79d8e1c300c8749381b4e5fad_full.jpg'
      },
      {
        id: 'e79ad0a5-6a4c-4e44-8267-201627391a1f',
        name: 'Luth',
        steam_id: '83456076',
        avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/a8/a8e5bab8e6da884db552a7ad09cf69a29290f0bf_full.jpg'
      },
    ]
  }

  res.json(team)
}

module.exports = getRoster
