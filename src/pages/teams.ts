import shortid from 'shortid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SeasonRepo, DivisionRepo, TeamRepo, TeamPlayerRepo, PlayerRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function list(
  templates: Templates, season: SeasonRepo, division: DivisionRepo, team: TeamRepo,
  req: Request, res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const teams = await team.getTeams(season_id, division_id)
    const html = templates.team.list({ user: req.user, season: s, division: d, teams })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function create(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const html = templates.team.edit({
      user: req.user, verb: 'Create', season: s, division: d, csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function edit(
  templates: Templates, season: SeasonRepo, division: DivisionRepo, team: TeamRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const id = req.params.id as string
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const t = await team.getTeam(id)
    const html = templates.team.edit({
      user: req.user, verb: 'Edit', team: t, season: s, division: d, csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(team: TeamRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id ? req.body.id : shortid.generate()
  const t = req.body
  t.id = id
  t.disbanded = t.disbanded == 'on' ? true : false
  t.team_number = t.team_number === '' ? null : t.team_number
  try {
    await team.saveTeam(t)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + t.id)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(team: TeamRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id
  try {
    await team.deleteTeam(id)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/teams')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function json(team: TeamRepo, season: SeasonRepo, team_player: TeamPlayerRepo, _req: Request, res: Response): Promise<void> {
  const _season = await season.getActiveSeason()
  if (!_season) { return }
  const teams = await team.getAllSeasonTeams(_season.id)
  const promises = teams.map(async (_team) => {
    const t = _team as Record<string, unknown>
    const roster = await team_player.getRoster(t.id as string)
    t.captain = { name: t.captain_name, id: t.captain_id }
    t.player = roster
    return t
  })
  const result = await Promise.all(promises)
  res.send({ [_season.name]: result })
}

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max))
}

async function importTeams(
  team: TeamRepo, season: SeasonRepo, division: DivisionRepo, player: PlayerRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const captains = await player.getPlayers({ season_id, division_id, is_captain: true })
    const promises = captains.map(_captain => {
      const toSave: Record<string, unknown> = {
        id: shortid.generate(),
        season_id,
        division_id,
        name: _captain.name,
        logo: '',
        standin_count: 0,
        team_number: null,
        disbanded: false,
        seed: getRandomInt(captains.length * 10)
      }
      return team.saveTeam(toSave)
    })
    await Promise.all(promises)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/teams')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  team: TeamRepo, team_player: TeamPlayerRepo, player: PlayerRepo
): Record<string, RouteDefinition> {
  return {
    list:        { route: '/seasons/:season_id/divisions/:division_id/teams',         handler: list.bind(null, templates, season, division, team) },
    create:      { route: '/seasons/:season_id/divisions/:division_id/teams/create',  handler: create.bind(null, templates, season, division) },
    edit:        { route: '/seasons/:season_id/divisions/:division_id/teams/:id/edit', handler: edit.bind(null, templates, season, division, team) },
    post:        { route: '/teams/edit',                                              handler: post.bind(null, team) },
    remove:      { route: '/teams/delete',                                            handler: remove.bind(null, team) },
    json:        { route: '/teams/json',                                              handler: json.bind(null, team, season, team_player) },
    importTeams: { route: '/seasons/:season_id/divisions/:division_id/teams/import',  handler: importTeams.bind(null, team, season, division, player) }
  }
}
