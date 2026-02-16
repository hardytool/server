import type { Request, Response } from 'express'
import type { SeasonRepo, DivisionRepo, PlayerRepo, RoleRepo, PlayerRoleRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'
import { toCSV } from '../lib/csv'

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

async function draftsheetCsv(
  player: PlayerRepo, role: RoleRepo, player_role: PlayerRoleRepo,
  req: Request, res: Response
): Promise<void> {
  const { season_id, division_id } = req.params as { season_id: string; division_id: string }
  try {
    const players = await player.getDraftSheet({ season_id, division_id })
    const roles = await role.getRoles()
    const roleRanks = await player_role.getRoleRanks()
    const rows = players.map(p => {
      const playerRanks = roleRanks
        .filter(rr => rr.player_id === p.id)
        .reduce<Record<string | number, number>>((acc, rr) => { acc[rr.role_id] = rr.rank; return acc }, {})
      const roleMap = roles.reduce<Record<string, number | undefined>>((acc, r) => {
        acc[r.name] = playerRanks[r.id]
        return acc
      }, {})
      return { ...p, ...roleMap }
    })
    const csv = await toCSV(rows as Record<string, unknown>[])
    if (!csv) { res.sendStatus(204); return }
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="draftsheet_s${season_id}_d${division_id}.csv"`)
    res.send(csv)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  season: SeasonRepo, division: DivisionRepo, player: PlayerRepo,
  role: RoleRepo, player_role: PlayerRoleRepo
): Record<string, RouteDefinition> {
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
    draftsheetCsv: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/draftsheet.csv',
      handler: draftsheetCsv.bind(null, player, role, player_role),
    },
  }
}
