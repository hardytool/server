function getUser(req, res) {
  if (!req.user) {
    res.status(403).json({ error: 'Must be authenticated' })
    return
  }

  var user = {
    id: '80eeb2e2-4015-4cea-a469-111c7b4d5fc7',
    name: 'Viuebabiurbehats',
    steam_id: '64908677',
    avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fa/facd65e8000505d06d78e01c756193974c6bc648_full.jpg',
    solo_mmr: '2662',
    party_mmr: '2951'
  }

  res.json(user)
}

module.exports = getUser
