import shortid from 'shortid'
import type { Request, Response } from 'express'
import type { TeamRepo, TeamPlayerRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function listByDivision(team: TeamRepo, req: Request, res: Response): Promise<void> {
  const { season_id, division_id } = req.params as { season_id: string; division_id: string }
  try {
    const teams = await team.getTeams(season_id, division_id)
    res.json(teams)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function view(team: TeamRepo, req: Request, res: Response): Promise<void> {
  const { team_id } = req.params as { team_id: string }
  try {
    const t = await team.getTeam(team_id)
    if (!t) { res.sendStatus(404); return }
    res.json(t)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function save(team: TeamRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const t = req.body
  t.id = t.id ? t.id : shortid.generate()
  try {
    await team.saveTeam(t)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(team: TeamRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { team_id } = req.params as { team_id: string }
  try {
    await team.deleteTeam(team_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function getRoster(team_player: TeamPlayerRepo, req: Request, res: Response): Promise<void> {
  const { team_id } = req.params as { team_id: string }
  try {
    const roster = await team_player.getRoster(team_id)
    res.json(roster)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function addToRoster(team_player: TeamPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { team_id } = req.params as { team_id: string }
  const { player_id, is_captain } = req.body as { player_id: string; is_captain?: boolean }
  try {
    await team_player.addPlayerToTeam(team_id, player_id, is_captain ?? false)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function removeFromRoster(team_player: TeamPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { team_id, player_id } = req.params as { team_id: string; player_id: string }
  try {
    await team_player.removePlayerFromTeam(team_id, player_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function getUnassigned(team_player: TeamPlayerRepo, req: Request, res: Response): Promise<void> {
  const { season_id, division_id } = req.params as { season_id: string; division_id: string }
  try {
    const players = await team_player.getUnassignedPlayers(season_id, division_id)
    res.json(players)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(team: TeamRepo, team_player: TeamPlayerRepo): Record<string, RouteDefinition> {
  return {
    listByDivision: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/teams',
      handler: listByDivision.bind(null, team),
    },
    view: {
      route: '/api/v1/teams/:team_id',
      handler: view.bind(null, team),
    },
    save: {
      route: '/api/v1/teams',
      handler: save.bind(null, team),
    },
    remove: {
      route: '/api/v1/teams/:team_id',
      handler: remove.bind(null, team),
    },
    getRoster: {
      route: '/api/v1/teams/:team_id/roster',
      handler: getRoster.bind(null, team_player),
    },
    addToRoster: {
      route: '/api/v1/teams/:team_id/roster',
      handler: addToRoster.bind(null, team_player),
    },
    removeFromRoster: {
      route: '/api/v1/teams/:team_id/roster/:player_id',
      handler: removeFromRoster.bind(null, team_player),
    },
    getUnassigned: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/unassigned',
      handler: getUnassigned.bind(null, team_player),
    },
  }
}
