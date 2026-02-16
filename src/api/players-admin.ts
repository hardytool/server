import type { Request, Response } from 'express'
import type { SeasonRepo, DivisionRepo, PlayerRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function standins(
  season: SeasonRepo, division: DivisionRepo, player: PlayerRepo,
  req: Request, res: Response
): Promise<void> {
  const { season_id, division_id } = req.params as { season_id: string; division_id: string }
  try {
    await season.getSeason(season_id)
    await division.getDivision(division_id)
    const result = await player.getPlayers({ season_id, division_id, is_standin: true })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(player: PlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { id } = req.params as { id: string }
  try {
    await player.deletePlayer(id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function activityCheck(player: PlayerRepo, season: SeasonRepo, req: Request, res: Response): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const steamId = (req.params.steam_id as string | undefined) ?? req.user.steamId
  try {
    const activeSeason = await season.getActiveSeason()
    if (!activeSeason) { res.status(400).json({ error: 'No active season' }); return }
    await player.activityCheck(activeSeason.id, steamId)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(season: SeasonRepo, division: DivisionRepo, player: PlayerRepo): Record<string, RouteDefinition> {
  return {
    standins: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/standins',
      handler: standins.bind(null, season, division, player),
    },
    remove: {
      route: '/api/v1/players/:id',
      handler: remove.bind(null, player),
    },
    activityCheck: {
      route: '/api/v1/activity-check',
      handler: activityCheck.bind(null, player, season),
    },
    activityCheckAdmin: {
      route: '/api/v1/activity-check/:steam_id',
      handler: activityCheck.bind(null, player, season),
    },
  }
}
