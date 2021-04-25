const shortid = require('shortid')
const request = require('request')
const steamId = require('../../lib/steamId')

async function list(templates, masters, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const team_id = req.params.team_id
  let wins = 0
  let losses = 0

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)
  const team = await masters.getTeam(team_id)

  const roster = await masters.getRoster(team.id)
  const series = await masters.getSeries({ team_id: team.id })

  const formattedSeries = series.map(_series => {
    _series.own = {}
    _series.opp = {}
    if (_series.home_team_id) {
      if (team_id == _series.home_team_id) {
        wins += _series.home_points
        losses += _series.away_points
        _series.own.id = _series.home_team_id
        _series.own.name = _series.home_team_name
        _series.own.logo = _series.home_team_logo
        _series.own.points = _series.home_points

        _series.opp.id = _series.away_team_id
        _series.opp.name = _series.away_team_name
        _series.opp.logo = _series.away_team_logo
        _series.opp.points = _series.away_points
      }
    }
    if (_series.away_team_id) {
      if (team_id == _series.away_team_id) {
        wins += _series.away_points
        losses += _series.home_points
        _series.own.id = _series.away_team_id
        _series.own.name = _series.away_team_name
        _series.own.logo = _series.away_team_logo
        _series.own.points = _series.away_points

        _series.opp.id = _series.home_team_id
        _series.opp.name = _series.home_team_name
        _series.opp.logo = _series.home_team_logo
        _series.opp.points = _series.home_points
      }
    }

    return _series
  })

  const html = templates.masters.rosters.list({
    user: req.user,
    season,
    division,
    team,
    roster,
    wins,
    losses,
    series: formattedSeries,
    csrfToken: req.csrfToken()
  })

  res.send(html)
}

async function add(templates, masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const team_id = req.params.team_id

  const season = await masters.getSeason(season_id)
  const division = await masters.getDivision(division_id)
  const team = await masters.getTeam(team_id)

  const html = templates.masters.rosters.edit({
    verb: 'Add',
    user: req.user,
    season: season,
    division: division,
    team: team,
    csrfToken: req.csrfToken()
  })

  res.send(html)
}

async function post(masters, steam_user, config, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const team_id = req.body.team_id

  const steam_id = req.body.steam_id
  const mmr_screenshot = req.body.mmr_screenshot
  const discord_id = req.body.discord_name
  const position = req.body.position

  if (!steam_id || !mmr_screenshot || !discord_id || !position) {
    return res.sendStatus(400)
  }

  const player = {
    id: shortid.generate(),
    steam_id: steam_id,
    steam_id_64: steamId.from32to64(steam_id).toString(),
    mmr_screenshot: mmr_screenshot,
    discord_id: discord_id,
    solo_mmr: 0,
    party_mmr: 0,
    rank: 0,
    previous_rank: null
  }

  const options = {
    url: `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.server.steam_api_key}&steamids=${player.steam_id_64}`,
    json: true
  }
  const asyncRequest = () => new Promise((resolve, reject) => request(options, function (error, response, body) {
    if( error ){
      reject(error)
    }
    resolve(body)
  }))

  const playersRequest = await asyncRequest()

  const steamPlayer = playersRequest.response.players[0]
  player.name = steamPlayer.personaname
  player.avatar = (steamPlayer.avatar || '/assets/seal-icon.png').replace('.jpg', '_full.jpg')

  await steam_user.saveSteamUser(player)
  const newPlayer = await masters.savePlayer(player)
  player.id = newPlayer.id

  await masters.addPlayerToTeam(team_id, player.id, position)
  res.redirect('/masters/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + team_id)
}

async function remove(masters, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const team_id = req.body.team_id
  const player_id = req.body.id

  await masters.removePlayerFromTeam(team_id, player_id)
  res.redirect('/masters/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + team_id)
}

module.exports = (templates, masters, steam_user, config) => {
  return {
    list: {
      route: '/masters/seasons/:season_id/divisions/:division_id/teams/:team_id',
      handler: list.bind(null, templates, masters)
    },
    add: {
      route: '/masters/seasons/:season_id/divisions/:division_id/teams/:team_id/add',
      handler: add.bind(null, templates, masters)
    },
    post: {
      route: '/masters/roster/edit',
      handler: post.bind(null, masters, steam_user, config)
    },
    remove: {
      route: '/masters/roster/delete',
      handler: remove.bind(null, masters)
    }
  }
}
