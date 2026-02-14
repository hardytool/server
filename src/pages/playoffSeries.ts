import shortid from 'shortid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SeasonRepo, TeamRepo, SeriesRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'
import swissPairingFactory from 'swiss-pairing'
type Pairings = ReturnType<typeof swissPairingFactory>

async function list(templates: Templates, _season: SeasonRepo, _series: SeriesRepo, req: Request, res: Response): Promise<void> {
  const season_id = req.params.season_id as string
  const season = await _season.getSeason(season_id)
  const playoffSeries = await _series.getSeries({ season_id, is_playoff: true })
  const series = playoffSeries.map(s => {
    const result: Record<string, unknown> = { ...s }
    if (s.home_team_id) {
      result.home = { id: s.home_team_id, name: s.home_team_name, division_id: s.home_team_division_id, logo: s.home_team_logo, points: s.home_points }
    }
    if (s.away_team_id) {
      result.away = { id: s.away_team_id, name: s.away_team_name, division_id: s.away_team_division_id, logo: s.away_team_logo, points: s.away_points }
    }
    return result
  })
  const html = templates.playoffSeries.list({ user: req.user, season, series })
  res.send(html)
}

async function create(templates: Templates, _season: SeasonRepo, _team: TeamRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const season = await _season.getSeason(season_id)
  const teams = await _team.getTeams(season.id)
  const series = { round: req.query.round, match_number: req.query.match }
  const html = templates.playoffSeries.edit({
    user: req.user, verb: 'Create', season, teams, series, csrfToken: req.csrfToken?.()
  })
  res.send(html)
}

async function edit(templates: Templates, _season: SeasonRepo, _team: TeamRepo, _series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const id = req.params.id as string
  const season = await _season.getSeason(season_id)
  const teams = await _team.getTeams(season.id)
  const playoffSeries = await _series.getSeries({ season_id, series_id: id, is_playoff: true })
  const s = playoffSeries[0] as Record<string, unknown>
  s.home = { id: s.home_team_id, name: s.home_team_name || 'Undecided', logo: s.home_team_logo, points: s.home_points }
  s.away = { id: s.away_team_id, name: s.away_team_name || 'Undecided', logo: s.away_team_logo, points: s.away_points }
  const html = templates.playoffSeries.edit({
    user: req.user, verb: 'Edit', season, teams, series: s, csrfToken: req.csrfToken?.()
  })
  res.send(html)
}

async function post(_series: SeriesRepo, _team: TeamRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const id = req.body.id ? req.body.id : shortid.generate()
  const series = req.body
  series.id = id
  if (series.home_team_id === '') series.home_team_id = null
  if (series.away_team_id === '') series.away_team_id = null
  if (!series.series_url) series.series_url = null
  if (series.home_points === '') series.home_points = null
  if (series.away_points === '') series.away_points = null
  series.is_playoff = true
  if (series.home_seed === '') series.home_seed = null
  if (series.away_seed === '') series.away_seed = null
  try {
    await _series.saveSeries(series)
    res.redirect('/bracket?season=' + season_id)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(_series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const id = req.body.id
  try {
    await _series.deleteSeries(id)
    res.redirect('/bracket?season=' + season_id)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function bracket(templates: Templates, _season: SeasonRepo, _team: TeamRepo, _series: SeriesRepo, _pairings: Pairings, req: Request, res: Response): Promise<void> {
  let season
  if (req.query.season) {
    season = await _season.getSeason(req.query.season as string)
  }
  if (!season || !season.id) {
    season = await _season.getActiveSeason()
  }
  if (!season || !season.id) {
    return res.redirect('/')
  }
  const seriesList = await _series.getSeries({ season_id: season.id, is_playoff: true })
  const roundOne = seriesList.filter(m => m.round === 1)
  const numberOfMatchups = roundOne.length * 2
  const numRounds = Math.ceil(Math.log2(numberOfMatchups))
  const currentRoundNum = 2
  const rounds: unknown[][] = [roundOne]
  for (let i = currentRoundNum; i <= numRounds; i++) {
    rounds.push(seriesList.filter(m => m.round === i))
  }
  let matchNum: number
  for (let round = 1; round < numRounds; round++) {
    matchNum = 1
    for (let matchInRound = 0; matchInRound < numberOfMatchups / Math.pow(2, round + 1); matchInRound++) {
      const r = rounds[round] as Array<Record<string, unknown>>
      if (!r[matchInRound] || r[matchInRound].match_number !== matchNum) {
        r.splice(matchInRound, 0, { match_number: matchNum, round: round + 1 })
      }
      matchNum++
    }
  }
  const html = templates.playoffSeries.bracket({ user: req.user, rounds, season })
  res.send(html)
}

export = function(templates: Templates, season: SeasonRepo, team: TeamRepo, series: SeriesRepo, pairings: Pairings): Record<string, RouteDefinition> {
  return {
    list:    { route: '/seasons/:season_id/playoff-series',          handler: list.bind(null, templates, season, series) },
    create:  { route: '/seasons/:season_id/playoff-series/create',   handler: create.bind(null, templates, season, team) },
    edit:    { route: '/seasons/:season_id/playoff-series/:id/edit', handler: edit.bind(null, templates, season, team, series) },
    post:    { route: '/playoff-series/edit',                        handler: post.bind(null, series, team) },
    remove:  { route: '/playoff-series/delete',                      handler: remove.bind(null, series) },
    bracket: { route: '/bracket',                                    handler: bracket.bind(null, templates, season, team, series, pairings) }
  }
}
