import shortid from 'shortid'
import type { Request, Response } from 'express'
import type { SeasonRepo, TeamRepo, SeriesRepo, DivisionRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'
import swissPairingFactory from 'swiss-pairing'
type Pairings = ReturnType<typeof swissPairingFactory>
type MappedSeriesEntry = Parameters<Pairings['getMatchups']>[2][0]

function mapSeries(rawSeries: Record<string, unknown>[]): MappedSeriesEntry[] {
  return rawSeries.map(s => ({
    round: s.round as number,
    home: { id: s.home_team_id as string | number | null, points: s.home_points as number | null },
    away: { id: s.away_team_id as string | number | null, points: s.away_points as number | null },
  }))
}

async function list(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  const { season_id, division_id } = req.params as { season_id: string; division_id: string }
  const round = req.query.round as string | undefined
  try {
    const result = await series.getSeries({ season_id, division_id, round })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function save(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const s = req.body
  s.id = s.id ? s.id : shortid.generate()
  if (s.home_team_id === '') s.home_team_id = null
  if (s.away_team_id === '') s.away_team_id = null
  if (!s.match_1_url) s.match_1_url = null
  if (!s.match_2_url) s.match_2_url = null
  if (!s.series_url) s.series_url = null
  if (s.home_points === '' || s.home_points === undefined) s.home_points = null
  if (s.away_points === '' || s.away_points === undefined) s.away_points = null
  if (!s.is_playoff) s.is_playoff = false
  try {
    await series.saveSeries(s)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { series_id } = req.params as { series_id: string }
  try {
    await series.deleteSeries(series_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function standings(
  season: SeasonRepo, team: TeamRepo, series: SeriesRepo, pairings: Pairings,
  req: Request, res: Response
): Promise<void> {
  const { season_id, division_id, round } = req.params as { season_id: string; division_id: string; round?: string }
  const roundNum = round ? Number.parseInt(round) : undefined
  try {
    const currentRound = await series.getCurrentRound(season_id, division_id, roundNum)
    const s = await season.getSeason(season_id)
    const teams = await team.getTeams(s.id, division_id)
    const seriesList = await series.getSeries({ season_id: s.id, division_id, round: currentRound })
    let standingsList = pairings.getStandings(currentRound, teams, mapSeries(seriesList)) as Record<string, unknown>[]
    let counter = 1
    standingsList = standingsList.map(standing => {
      const t = teams.find(tm => tm.id === standing.id) as Record<string, unknown> | undefined
      standing.name = t?.name
      standing.logo = t?.logo
      standing.captain_name = t?.captain_name
      standing.disbanded = t?.disbanded
      standing.placement = standing.disbanded ? '-' : counter++
      return standing
    })
    res.json({ round: currentRound, standings: standingsList })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function matchups(
  season: SeasonRepo, team: TeamRepo, series: SeriesRepo, pairings: Pairings,
  req: Request, res: Response
): Promise<void> {
  const { season_id, division_id, round } = req.params as { season_id: string; division_id: string; round?: string }
  const roundNum = round ? Number.parseInt(round) : undefined
  try {
    const currentRound = await series.getCurrentRound(season_id, division_id, roundNum)
    const s = await season.getSeason(season_id)
    const teams = (await team.getTeams(s.id, division_id)) as Record<string, unknown>[]
    const allSeries = await series.getSeries({ season_id: s.id, division_id })
    const nextRound = currentRound + 1
    const matchupList = pairings.getMatchups(nextRound, teams, mapSeries(allSeries))
    res.json({ round: nextRound, matchups: matchupList, teams })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function getCurrentRound(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  const { season_id, division_id } = req.params as { season_id: string; division_id: string }
  try {
    const round = await series.getCurrentRound(season_id, division_id)
    res.json({ round })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function saveRound(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { season_id, division_id } = req.params as { season_id: string; division_id: string }
  const { round } = req.body as { round: number }
  try {
    await series.saveCurrentRound(season_id, division_id, round)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function listPlayoff(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  const { season_id } = req.params as { season_id: string }
  try {
    const result = await series.getSeries({ season_id, is_playoff: true })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function savePlayoff(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const s = req.body
  s.id = s.id ? s.id : shortid.generate()
  if (s.home_team_id === '') s.home_team_id = null
  if (s.away_team_id === '') s.away_team_id = null
  if (!s.series_url) s.series_url = null
  if (s.home_points === '') s.home_points = null
  if (s.away_points === '') s.away_points = null
  s.is_playoff = true
  if (s.home_seed === '') s.home_seed = null
  if (s.away_seed === '') s.away_seed = null
  try {
    await series.saveSeries(s)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function removePlayoff(series: SeriesRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { series_id } = req.params as { series_id: string }
  try {
    await series.deleteSeries(series_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function bracket(
  season: SeasonRepo, team: TeamRepo, series: SeriesRepo,
  req: Request, res: Response
): Promise<void> {
  const { season_id } = req.params as { season_id: string }
  try {
    const s = await season.getSeason(season_id)
    const playoffSeries = await series.getSeries({ season_id, is_playoff: true })
    const allTeams = await team.getAllSeasonTeams(s.id)
    // Group by round and match_number to build bracket rounds
    const rounds: Record<number, typeof playoffSeries> = {}
    for (const ps of playoffSeries) {
      const r = ps.round ?? 1
      if (!rounds[r]) rounds[r] = []
      rounds[r].push(ps)
    }
    const roundArrays = Object.keys(rounds)
      .sort((a, b) => Number(a) - Number(b))
      .map(r => rounds[Number(r)].sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0)))
    res.json({ season: s, rounds: roundArrays, teams: allTeams })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  season: SeasonRepo, team: TeamRepo, series: SeriesRepo,
  _division: DivisionRepo, pairings: Pairings
): Record<string, RouteDefinition> {
  return {
    list: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/series',
      handler: list.bind(null, series),
    },
    save: {
      route: '/api/v1/series',
      handler: save.bind(null, series),
    },
    remove: {
      route: '/api/v1/series/:series_id',
      handler: remove.bind(null, series),
    },
    standings: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/standings',
      handler: standings.bind(null, season, team, series, pairings),
    },
    standingsByRound: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/standings/:round',
      handler: standings.bind(null, season, team, series, pairings),
    },
    matchups: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/matchups',
      handler: matchups.bind(null, season, team, series, pairings),
    },
    matchupsByRound: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/matchups/:round',
      handler: matchups.bind(null, season, team, series, pairings),
    },
    getCurrentRound: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/round',
      handler: getCurrentRound.bind(null, series),
    },
    saveRound: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/round',
      handler: saveRound.bind(null, series),
    },
    listPlayoff: {
      route: '/api/v1/seasons/:season_id/playoff-series',
      handler: listPlayoff.bind(null, series),
    },
    savePlayoff: {
      route: '/api/v1/playoff-series',
      handler: savePlayoff.bind(null, series),
    },
    removePlayoff: {
      route: '/api/v1/playoff-series/:series_id',
      handler: removePlayoff.bind(null, series),
    },
    bracket: {
      route: '/api/v1/seasons/:season_id/bracket',
      handler: bracket.bind(null, season, team, series),
    },
  }
}
