import shortid from 'shortid'
import type { Request, Response } from 'express'
import type { SeasonRepo, DivisionRepo, PlayerRepo, PlayerRoleRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function getRegistration(
  season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, player_role: PlayerRoleRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const { season_id, division_id } = req.params as { season_id: string; division_id: string }
  try {
    const players = await player.getPlayers({ season_id, division_id, steam_id: req.user.steamId })
    const existing = players[0]
    if (!existing) {
      res.json({ registered: false })
      return
    }
    const roles = await player_role.getRoleRanks({ player_id: existing.id })
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    res.json({ registered: true, ...existing, roles, season: s, division: d })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function register(
  season: SeasonRepo, division: DivisionRepo, player: PlayerRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const body = req.body as {
    season_id?: string; division_id?: string; will_captain?: string; statement?: string; id?: string
  }
  try {
    const activeSeason = await season.getActiveSeason()
    if (!activeSeason) { res.status(400).json({ error: 'No active season' }); return }
    if (!activeSeason.registration_open) {
      res.status(400).json({ error: 'Registration is not open' }); return
    }
    const divisions = await division.getDivisions({ active: true })
    const targetDivision = body.division_id
      ? divisions.find(d => String(d.id) === String(body.division_id))
      : divisions[0]
    if (!targetDivision) { res.status(400).json({ error: 'Division not found' }); return }
    const existing = await player.getPlayers({
      season_id: activeSeason.id, division_id: targetDivision.id, steam_id: req.user.steamId
    })
    const id = existing[0]?.id ?? shortid.generate()
    await player.savePlayer({
      id,
      steam_id: req.user.steamId,
      season_id: activeSeason.id,
      division_id: targetDivision.id,
      will_captain: (body.will_captain as 'yes' | 'no' | 'maybe') ?? 'no',
      statement: body.statement ?? '',
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function unregister(season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  try {
    const activeSeason = await season.getActiveSeason()
    if (!activeSeason) { res.status(400).json({ error: 'No active season' }); return }
    const divisions = await division.getDivisions({ active: true })
    const targetDivision = divisions[0]
    if (!targetDivision) { res.status(400).json({ error: 'Division not found' }); return }
    await player.unregisterPlayer(activeSeason.id, targetDivision.id, req.user.steamId)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, player_role: PlayerRoleRepo
): Record<string, RouteDefinition> {
  return {
    getRegistration: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/registration',
      handler: getRegistration.bind(null, season, division, player, player_role),
    },
    register: {
      route: '/api/v1/register',
      handler: register.bind(null, season, division, player),
    },
    unregister: {
      route: '/api/v1/register',
      handler: unregister.bind(null, season, division, player),
    },
  }
}
