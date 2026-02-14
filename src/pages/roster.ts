import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SeasonRepo, DivisionRepo, TeamRepo, TeamPlayerRepo, SeriesRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function list(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  team: TeamRepo, team_player: TeamPlayerRepo, series: SeriesRepo,
  req: Request, res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const team_id = req.params.team_id as string
  let wins = 0
  let losses = 0
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const t = await team.getTeam(team_id)
    if (!t) { res.sendStatus(404); return }
    let players = await team_player.getRoster(t.id)
    let seriesList = await series.getSeries({ team_id: t.id })
    const captain = players.filter(player => player.is_captain)[0]
    players = players.filter(player => !captain || player.id != captain.id)
    const mappedSeries = seriesList.map((_series: Record<string, unknown>) => {
      const s = { ..._series } as Record<string, unknown>
      s.own = {}
      s.opp = {}
      if (s.home_team_id) {
        if (team_id == s.home_team_id) {
          wins += s.home_points as number
          losses += s.away_points as number
          ;(s.own as Record<string, unknown>).id = s.home_team_id
          ;(s.own as Record<string, unknown>).name = s.home_team_name
          ;(s.own as Record<string, unknown>).logo = s.home_team_logo
          ;(s.own as Record<string, unknown>).points = s.home_points
          ;(s.opp as Record<string, unknown>).id = s.away_team_id
          ;(s.opp as Record<string, unknown>).name = s.away_team_name
          ;(s.opp as Record<string, unknown>).logo = s.away_team_logo
          ;(s.opp as Record<string, unknown>).points = s.away_points
        }
      }
      if (s.away_team_id) {
        if (team_id == s.away_team_id) {
          wins += s.away_points as number
          losses += s.home_points as number
          ;(s.own as Record<string, unknown>).id = s.away_team_id
          ;(s.own as Record<string, unknown>).name = s.away_team_name
          ;(s.own as Record<string, unknown>).logo = s.away_team_logo
          ;(s.own as Record<string, unknown>).points = s.away_points
          ;(s.opp as Record<string, unknown>).id = s.home_team_id
          ;(s.opp as Record<string, unknown>).name = s.home_team_name
          ;(s.opp as Record<string, unknown>).logo = s.home_team_logo
          ;(s.opp as Record<string, unknown>).points = s.home_points
        }
      }
      return s
    })
    const html = templates.roster.list({
      user: req.user,
      season: s,
      division: d,
      team: t,
      captain,
      players,
      wins,
      losses,
      series: mappedSeries,
      csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function add(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  team: TeamRepo, team_player: TeamPlayerRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const team_id = req.params.team_id as string
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const t = await team.getTeam(team_id)
    const players = await team_player.getUnassignedPlayers(s.id, d.id)
    const html = templates.roster.edit({
      verb: 'Add',
      user: req.user,
      season: s,
      division: d,
      team: t,
      players,
      csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(team_player: TeamPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const team_id = req.body.team_id
  const p = req.body
  p.is_captain = p.is_captain === 'on'
  try {
    await team_player.addPlayerToTeam(team_id, p.player_id, p.is_captain)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + team_id)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(team_player: TeamPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const team_id = req.body.team_id
  const player_id = req.body.id
  try {
    await team_player.removePlayerFromTeam(team_id, player_id)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + team_id)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  team: TeamRepo, team_player: TeamPlayerRepo, series: SeriesRepo
): Record<string, RouteDefinition> {
  return {
    list:   { route: '/seasons/:season_id/divisions/:division_id/teams/:team_id',      handler: list.bind(null, templates, season, division, team, team_player, series) },
    add:    { route: '/seasons/:season_id/divisions/:division_id/teams/:team_id/add',  handler: add.bind(null, templates, season, division, team, team_player) },
    post:   { route: '/roster/edit',                                                   handler: post.bind(null, team_player) },
    remove: { route: '/roster/delete',                                                 handler: remove.bind(null, team_player) }
  }
}
