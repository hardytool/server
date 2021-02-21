const shortid = require('shortid')
const request = require('request')
const steamId = require('../../lib/steamId')

async function view(templates, masters, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id

  const season = await masters.getSeason(season_id)

  if (!req.user) {
    const html = templates.error.unauthenticated({
      user: req.user,
      error: `Please log in to be able to register for Season ${season.number}`
    })
    return res.send(html)
  }

  const division = await masters.getDivision(division_id)
  const player = await masters.getPlayer(req.user.steamId)

  const html = templates.masters.registration.edit({
    user: req.user,
    season,
    division,
    player,
    csrfToken: req.csrfToken()
  })
  res.send(html)
}

async function shortcut(templates, masters, req, res) {
  const season = await masters.getActiveSeason()
  req.params.season_id = season.id
  return view(templates, masters, req, res)
}

async function directory(templates, masters, req, res) {
  const season_id = req.params.season_id
  const season = await masters.getSeason(season_id)

  if (!req.user) {
    const html = templates.error.unauthenticated({
      user: req.user,
      error: `Please log in to be able to register for Season ${season.number}`
    })
    return res.send(html)
  }

  const divisions = await masters.getDivisions()

  if (divisions.length === 0) {
    const html = templates.error.no_divisions({
      user: req.user,
      error: 'There don\'t appear to be any active divisions. Ping an admin.'
    })
    res.send(html)
  }

  const currentSeasonPlayerTeams = await masters.getPlayerTeams(req.user.steamId, season.id)

  const divisionsWithRegistration = divisions.map((d) => {
    d.registered = currentSeasonPlayerTeams.some((cspt) => cspt.division_id === d.id)
    return d
  })

  const html = templates.masters.registration.directory({
    user: req.user,
    season: season,
    divisions: divisionsWithRegistration
  })
  res.send(html)
}

async function directoryShortcut(templates, masters, req, res) {
  const season = await masters.getActiveSeason()

  if (season) {
    req.params.season_id = season.id
    return directory(templates, masters, req, res)
  } else {
    const html = templates.error.no_seasons({
      user: req.user
    })
    res.send(html)
  }
}

async function post(templates, masters, steam_user, config, req, res) {
  if (!req.user) {
    res.sendStatus(403)
    return
  }

  const season = await masters.getSeason(req.body.season_id)
  const division = await masters.getDivision(req.body.division_id)

  const players = [
    { position: 1 },
    { position: 2 },
    { position: 3 },
    { position: 4 },
    { position: 5 }
  ]

  for (const player of players) {
    const steam_id = req.body[`steam_id_${player.position}`]
    const mmr_screenshot = req.body[`mmr_screenshot_${player.position}`]
    const discord_id = req.body[`discord_name_${player.position}`]

    if (!steam_id || !mmr_screenshot || !discord_id) {
      return res.sendStatus(400)
    }

    player.id = shortid.generate()
    player.steam_id = steam_id
    player.steam_id_64 = steamId.from32to64(steam_id).toString()
    player.mmr_screenshot = mmr_screenshot
    player.discord_id = discord_id

    player.solo_mmr = 0
    player.party_mmr = 0
    player.rank = 0
    player.previous_rank = null
  }

  const options = {
    url: `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.server.steam_api_key}&steamids=${players.map((p) => p.steam_id_64).join(',')}`,
    json: true
  }
  const asyncRequest = () => new Promise((resolve, reject) => request(options, function (error, response, body) {
    if( error ){
      reject(error)
    }
    resolve(body)
  }))

  const playersRequest = await asyncRequest()
  const steamPlayers = playersRequest.response.players
  for (const steamPlayer of steamPlayers) {
    const player = players.find((p) => p.steam_id_64 === steamPlayer.steamid)
    player.name = steamPlayer.personaname
    player.avatar = (steamPlayer.avatar || '/assets/seal-icon.png').replace('.jpg', '_full.jpg')
  }

  for (const player of players) {
    await steam_user.saveSteamUser(player)
    const newPlayer = await masters.savePlayer(player)
    player.id = newPlayer.id
  }

  const team = await masters.saveTeam({
    id: shortid.generate(),
    season_id: req.body.season_id,
    division_id: req.body.division_id,
    name: req.body.name,
    logo: req.body.logo,
    scheduler_discord_id: req.body.scheduler_discord_id,
    approved: false
  })

  for (const player of players) {
    await masters.addPlayerToTeam(team.id, player.id, player.position)
  }

  const html = templates.masters.registration.discord({
    user: req.user,
    season: season,
    division: division
  })

  res.send(html)
}

module.exports = (templates, masters, steam_user, config) => {
  return {
    view: {
      route: '/masters/seasons/:season_id/divisions/:division_id/register',
      handler: view.bind(null, templates, masters)
    },
    shortcut: {
      route: '/masters/divisions/:division_id/register',
      handler: shortcut.bind(null, templates, masters)
    },
    directory: {
      route: '/masters/seasons/:season_id/register',
      handler: directory.bind(null, templates, masters)
    },
    directoryShortcut: {
      route: '/masters/register',
      handler: directoryShortcut.bind(null, templates, masters)
    },
    post: {
      route: '/masters/register',
      handler: post.bind(null, templates, masters, steam_user, config)
    }
  }
}
