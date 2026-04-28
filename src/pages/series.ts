import { nanoid } from 'nanoid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SeasonRepo, TeamRepo, SeriesRepo, DivisionRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'
import swissPairingFactory from 'swiss-pairing'
type Pairings = ReturnType<typeof swissPairingFactory>
type MappedSeriesEntry = Parameters<Pairings['getMatchups']>[2][0]

function mapSeries(series: Record<string, unknown>[]): MappedSeriesEntry[] {
  return series.map(s => ({
    round: s.round as number,
    home: { id: s.home_team_id as string | number | null, points: s.home_points as number | null },
    away: { id: s.away_team_id as string | number | null, points: s.away_points as number | null }
  }))
}

async function list(
  templates: Templates, season: SeasonRepo, series: SeriesRepo, division: DivisionRepo,
  req: Request, res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const round = req.query.round as string | undefined
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const rawSeriesList = await series.getSeries({ season_id, division_id, round })
    const seriesList = rawSeriesList.map(_series => {
      const result = { ..._series } as Record<string, unknown>
      if (result.home_team_id) {
        result.home = { id: result.home_team_id, logo: result.home_team_logo, points: result.home_points } as Record<string, unknown>
        if (result.home_team_name != result.home_team_captain_name) {
          (result.home as Record<string, unknown>).name = `${result.home_team_name} (${result.home_team_captain_name})`
        } else {
          (result.home as Record<string, unknown>).name = result.home_team_captain_name
        }
      }
      if (result.away_team_id) {
        result.away = { id: result.away_team_id, logo: result.away_team_logo, points: result.away_points } as Record<string, unknown>
        if (result.away_team_name != result.away_team_captain_name) {
          (result.away as Record<string, unknown>).name = `${result.away_team_name} (${result.away_team_captain_name})`
        } else {
          (result.away as Record<string, unknown>).name = result.away_team_captain_name
        }
      }
      return result
    })
    const html = templates.series.list({ user: req.user, season: s, division: d, series: seriesList })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function create(
  templates: Templates, season: SeasonRepo, team: TeamRepo, division: DivisionRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const teams = await team.getTeams(s.id, d.id)
    const html = templates.series.edit({
      user: req.user, verb: 'Create', season: s, division: d, teams, csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function edit(
  templates: Templates, season: SeasonRepo, team: TeamRepo, series: SeriesRepo, division: DivisionRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const id = req.params.id as string
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const teams = await team.getTeams(s.id, d.id)
    const seriesList = await series.getSeries({ series_id: id })
    const sr = seriesList[0] as Record<string, unknown>
    sr.home = { id: sr.home_team_id, name: sr.home_team_name, logo: sr.home_team_logo, points: sr.home_points }
    sr.away = { id: sr.away_team_id, name: sr.away_team_name, logo: sr.away_team_logo, points: sr.away_points }
    const html = templates.series.edit({
      user: req.user, verb: 'Edit', season: s, division: d, teams, series: sr, csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id ? req.body.id : nanoid()
  const s = req.body
  s.id = id
  if (s.home_team_id === '') s.home_team_id = null
  if (s.away_team_id === '') s.away_team_id = null
  if (s.home_team_id === null && s.away_team_id === null) {
    res.status(400).send('A series must have at least one team — both teams cannot be BYE.')
    return
  }
  if (!s.match_1_url) s.match_1_url = null
  if (!s.match_2_url) s.match_2_url = null
  const forfeit1 = s.match_1_forfeit_home
  const forfeit2 = s.match_2_forfeit_home
  s.match_1_forfeit_home = forfeit1 === 'home' ? true : forfeit1 === 'away' ? false : null
  s.match_2_forfeit_home = forfeit2 === 'home' ? true : forfeit2 === 'away' ? false : null
  if (!s.is_playoff) s.is_playoff = false
  try {
    await series.saveSeries(s)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id
  try {
    await series.deleteSeries(id)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function standings(
  templates: Templates, season: SeasonRepo, team: TeamRepo, series: SeriesRepo,
  pairings: Pairings, division: DivisionRepo,
  req: Request, res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const round = Number.parseInt(req.params.round as string)
  try {
    const maximumRound = await series.getCurrentRound(season_id, division_id)
    const currentRound = await series.getCurrentRound(season_id, division_id, round)
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const teams = await team.getTeams(s.id, d.id)
    const seriesList = await series.getSeries({ season_id: s.id, division_id: d.id, round: currentRound })
    let standingsList = pairings.getStandings(currentRound, teams, mapSeries(seriesList)) as Record<string, unknown>[]
    let counter = 1
    standingsList = standingsList.map(standing => {
      const t = teams.filter(tm => tm.id === standing.id)[0] as Record<string, unknown>
      standing.name = t.name
      standing.logo = t.logo
      standing.captain_name = t.captain_name
      standing.disbanded = t.disbanded
      standing.placement = standing.disbanded ? '-' : counter++
      return standing
    })
    const html = templates.series.standings({
      user: req.user, season: s, division: d, round: currentRound, maximumRound, standings: standingsList
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function matchups(
  templates: Templates, season: SeasonRepo, team: TeamRepo, series: SeriesRepo,
  pairings: Pairings, division: DivisionRepo,
  req: Request, res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const round = Number.parseInt(req.params.round as string)
  try {
    const maximumRound = await series.getCurrentRound(season_id, division_id)
    const currentRound = await series.getCurrentRound(season_id, division_id, round)
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    let teams = (await team.getTeams(s.id, d.id)) as Record<string, unknown>[]
    teams = teams.map(t => { t.droppedOut = t.disbanded; return t })
    if (currentRound === 0) {
      teams = teams.sort((a, b) => (a.id as string).localeCompare(b.id as string))
      teams = teams.map((t, i) => { t.seed = i; return t })
    } else {
      teams = teams.sort((a, b) => {
        if (a.seed === b.seed) return (a.id as string).localeCompare(b.id as string)
        return (a.seed as number) - (b.seed as number)
      })
    }
    const seriesList = await series.getSeries({ season_id: s.id, division_id: d.id, round: currentRound })
    let matchupsList = pairings.getMatchups(currentRound, teams, mapSeries(seriesList)) as Record<string, unknown>[]
    matchupsList = matchupsList.map(matchup => {
      matchup.home = teams.filter(t => t.id === matchup.home)[0]
      matchup.away = matchup.away === null
        ? { id: null, name: 'BYE', logo: null }
        : teams.filter(t => t.id === matchup.away)[0]
      return matchup
    })
    const html = templates.series.matchups({
      user: req.user, season: s, division: d, round: currentRound, maximumRound, matchups: matchupsList
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function editRound(
  templates: Templates, _season: SeasonRepo, _division: DivisionRepo, series: SeriesRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const round = await series.getCurrentRound(season_id, division_id)
    const html = templates.series.round({
      user: req.user, season_id, division_id, round, csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function saveRound(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const round = req.body.round
  try {
    await series.saveCurrentRound(season_id, division_id, round)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function newRound(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const round = 0
  try {
    await series.saveCurrentRound(season_id, division_id, round)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function importSeries(
  series: SeriesRepo, season: SeasonRepo, team: TeamRepo,
  pairings: Pairings, division: DivisionRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const round = Number.parseInt(req.params.round as string)
  try {
    const currentRound = await series.getCurrentRound(season_id, division_id, round)
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    let teams = (await team.getTeams(s.id, d.id)) as Record<string, unknown>[]
    teams = teams.map(t => { t.droppedOut = t.disbanded; return t })
    if (currentRound === 0) {
      teams = teams.sort((a, b) => (a.id as string).localeCompare(b.id as string))
      teams = teams.map((t, i) => { t.seed = i; return t })
    } else {
      teams = teams.sort((a, b) => {
        if (a.seed === b.seed) return (a.id as string).localeCompare(b.id as string)
        return (a.seed as number) - (b.seed as number)
      })
    }
    const _series = await series.getSeries({ season_id: s.id, division_id: d.id, round: currentRound })
    let matchupsList = pairings.getMatchups(currentRound, teams, mapSeries(_series)) as Record<string, unknown>[]
    matchupsList = matchupsList.map(matchup => {
      matchup.home = teams.filter(t => t.id === matchup.home)[0]
      matchup.away = matchup.away === null
        ? { id: null, name: 'BYE', logo: null }
        : teams.filter(t => t.id === matchup.away)[0]
      return matchup
    })
    const promises = matchupsList.map((_matchup: Record<string, unknown>) => {
      const toSave: Record<string, unknown> = {
        id: nanoid(),
        round: currentRound,
        season_id,
        division_id,
        home_team_id: (_matchup.home as Record<string, unknown>).id,
        away_team_id: (_matchup.away as Record<string, unknown>).id,
        home_points: 0,
        away_points: 0,
        match_1_url: null,
        match_2_url: null,
        match_1_forfeit_home: null,
        match_2_forfeit_home: null,
        is_playoff: false
      }
      return series.saveSeries(toSave)
    })
    await Promise.all(promises)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/series')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  templates: Templates, season: SeasonRepo, team: TeamRepo,
  series: SeriesRepo, pairings: Pairings, division: DivisionRepo
): Record<string, RouteDefinition> {
  return {
    list:         { route: '/seasons/:season_id/divisions/:division_id/series',                      handler: list.bind(null, templates, season, series, division) },
    create:       { route: '/seasons/:season_id/divisions/:division_id/series/create',               handler: create.bind(null, templates, season, team, division) },
    edit:         { route: '/seasons/:season_id/divisions/:division_id/series/:id/edit',             handler: edit.bind(null, templates, season, team, series, division) },
    post:         { route: '/series/edit',                                                           handler: post.bind(null, series) },
    remove:       { route: '/series/delete',                                                         handler: remove.bind(null, series) },
    standings:    { route: '/seasons/:season_id/divisions/:division_id/standings{/:round}',          handler: standings.bind(null, templates, season, team, series, pairings, division) },
    matchups:     { route: '/seasons/:season_id/divisions/:division_id/matchups{/:round}',           handler: matchups.bind(null, templates, season, team, series, pairings, division) },
    editRound:    { route: '/seasons/:season_id/divisions/:division_id/round/edit',                  handler: editRound.bind(null, templates, season, division, series) },
    saveRound:    { route: '/round/edit',                                                            handler: saveRound.bind(null, series) },
    newRound:     { route: '/seasons/:season_id/divisions/:division_id/round/newRound',              handler: newRound.bind(null, series) },
    importSeries: { route: '/seasons/:season_id/divisions/:division_id/week/:round/importSeries',    handler: importSeries.bind(null, series, season, team, pairings, division) }
  }
}
