const shortid = require('shortid')

async function list(templates, _season, _playoffSeries, req, res) {
  const season_id = req.params.season_id;

  const season = await _season.getSeason(season_id);
  const playoffSeries = await _playoffSeries.getPlayoffSeries(season_id);

  const series = playoffSeries.map(_series => {
    if (_series.home_team_id) {
      _series.home = {};
      _series.home.id = _series.home_team_id;
      _series.home.name = _series.home_team_name;
      _series.home.division_id = _series.home_division_id;
      _series.home.logo = _series.home_team_logo;
      _series.home.points = _series.home_points;
    }
    if (_series.away_team_id) {
      _series.away = {};
      _series.away.id = _series.away_team_id;
      _series.away.name = _series.away_team_name;
      _series.away.division_id = _series.away_division_id;
      _series.away.logo = _series.away_team_logo;
      _series.away.points = _series.away_points;
    }
    return _series
  })

  const html = templates.playoffSeries.list({
    user: req.user,
    season: season,
    series: series
  })

  res.send(html);
}

async function create(templates, _season, _team, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403);
    return;
  }

  const season_id = req.params.season_id;

  const season = await _season.getSeason(season_id);
  const teams = await _team.getTeams(season.id);

  const html = templates.playoffSeries.edit({
    user: req.user,
    verb: 'Create',
    season: season,
    teams: teams,
    csrfToken: req.csrfToken()
  });

  res.send(html);
}

async function edit(templates, _season, _team, _playoffSeries, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403);
    return;
  }

  const season_id = req.params.season_id;
  const id = req.params.id;

  const season = await _season.getSeason(season_id);
  const teams = await _team.getTeams(season.id);
  const playoffSeries = await _playoffSeries.getPlayoffSeries(season_id, id);

  const series = playoffSeries[0];
  series.home = {};
  series.home.id = series.home_team_id;
  series.home.name = series.home_team_name ? series.home_team_name : 'Undecided';
  series.home.logo = series.home_team_logo;
  series.home.points = series.home_points;
  series.away = {};
  series.away.id = series.away_team_id;
  series.away.name = series.away_team_name ? series.away_team_name : 'Undecided';
  series.away.logo = series.away_team_logo;
  series.away.points = series.away_points;

  const html = templates.playoffSeries.edit({
    user: req.user,
    verb: 'Edit',
    season: season,
    teams: teams,
    series: series,
    csrfToken: req.csrfToken()
  });

  res.send(html);
}

async function post(playoffSeries, _team, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403);
    return;
  }

  const season_id = req.body.season_id;
  const id = req.body.id ? req.body.id : shortid.generate();
  const s = req.body;
  s.id = id;

  if (s.home_team_id === '') {
    s.home_team_id = null;
  } else {
    const homeTeam = await _team.getTeam(s.home_team_id);
    s.home_division_id = homeTeam.division_id;
  }

  if (s.away_team_id === '') {
    s.away_team_id = null;
  } else {
    const awayTeam = await _team.getTeam(s.away_team_id);
    s.away_division_id = awayTeam.division_id;
  }

  const matchUrl = s.match_url;
  if (!matchUrl) {
    s.match_url = null;
  }

  playoffSeries.savePlayoffSeries(s).then(() => {
    res.redirect('/seasons/' + season_id + '/playoff-series')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(playoffSeries, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id

  playoffSeries.deletePlayoffSeries(id).then(() => {
    res.redirect('/seasons/' + season_id + '/playoff-series')
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

async function bracket(templates, _season, _team, _playoffSeries, _pairings, req, res) {
  const season_id = req.params.season_id

  const season = await _season.getSeason(season_id);
  const series = await _playoffSeries.getPlayoffSeries(season.id);
  console.log(series)

  const roundOne = series.filter((matchup) => {
    return matchup.round === 1;
  });

  const numberOfMatchups = roundOne.length * 2;
  const numRounds = Math.ceil(Math.log2(numberOfMatchups));

  let remainingSeries = series.slice(roundOne.length - 1);
  let currentRoundNum = 2;

  const rounds = [];
  rounds.push(roundOne);

  for (let i = currentRoundNum; i <= numRounds; i++) {
    rounds.push(
      series.filter((matchup) => {
        return matchup.round === i;
      })
    )
  }

  //fill empty matches where needed
  let matchNum;
  for (let round = 1; round < numRounds; round++) {
    matchNum = 1
    for (let matchInRound = 0; matchInRound < numberOfMatchups/Math.pow(2,round+1); matchInRound++) {
      if (!rounds[round][matchInRound] || rounds[round][matchInRound].match_number !== matchNum) {
        rounds[round].splice(matchInRound, 0, {match_number: matchNum});
      }
      matchNum++;
    }
  }

  const html = templates.playoffSeries.bracket({
    user: req.user,
    rounds: rounds,
    season: season,
  });

  res.send(html)

}

module.exports = (templates, season, team, playoffSeries, pairings) => {
  return {
    list: {
      route: '/seasons/:season_id/playoff-series',
      handler: list.bind(null, templates, season, playoffSeries)
    },
    create: {
      route: '/seasons/:season_id/playoff-series/create',
      handler: create.bind(null, templates, season, team),
    },
    edit: {
      route: '/seasons/:season_id/playoff-series/:id/edit',
      handler: edit.bind(null, templates, season, team, playoffSeries),
    },
    post: {
      route: '/playoff-series/edit',
      handler: post.bind(null, playoffSeries, team)
    },
    remove: {
      route: '/playoff-series/delete',
      handler: remove.bind(null, playoffSeries)
    },
    bracket: {
      route: '/seasons/:season_id/bracket',
      handler: bracket.bind(null, templates, season, team, playoffSeries, pairings)
    }
  }
}
