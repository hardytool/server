import type { Request, Response } from 'express'
import type { SeasonRepo, DivisionRepo, PlayerRepo, PlayerRoleRepo, RoleRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'
import type { DraftSheetRow } from '../types/db'

interface DraftSheetWithRoles extends DraftSheetRow {
  roles: Record<string, number | undefined>
}

async function list(
  season: SeasonRepo,
  division: DivisionRepo,
  player: PlayerRepo,
  player_role: PlayerRoleRepo,
  role: RoleRepo,
  req: Request,
  res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    await season.getSeason(season_id)
    await division.getDivision(division_id)
    const players = await player.getDraftSheet({ season_id, division_id })
    const roles = await role.getRoles()
    const roleRanks = await player_role.getRoleRanks()
    const captains = await player.getPlayers({
      season_id,
      division_id,
      is_captain: true
    })
    const maxPlayers = captains.length * 4
    const playersWithRoles: DraftSheetWithRoles[] = players.map(p => {
      const playerRoleRanks = roleRanks
        .filter(rr => rr.player_id === p.id)
        .reduce<Record<string | number, number>>((acc, rr) => {
          acc[rr.role_id] = rr.rank
          return acc
        }, {})
      const roleMap = roles.reduce<Record<string, number | undefined>>((acc, r) => {
        acc[r.name] = playerRoleRanks[r.id]
        return acc
      }, {})
      return { ...p, roles: roleMap }
    })
    res.json({
      draftable: playersWithRoles.slice(0, maxPlayers),
      belowCutoff: playersWithRoles.slice(maxPlayers)
    })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function captains(
  season: SeasonRepo,
  division: DivisionRepo,
  player: PlayerRepo,
  req: Request,
  res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  let normal = true
  if (req.query.reverse_mmr && req.query.reverse_mmr === 'true') {
    normal = false
  }
  try {
    await season.getSeason(season_id)
    await division.getDivision(division_id)
    const result = await player.getPlayers(
      { season_id, division_id, is_captain: true },
      { by_mmr: normal, by_reverse_mmr: !normal }
    )
    res.json(result)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, player_role: PlayerRoleRepo, role: RoleRepo): Record<string, RouteDefinition> {
  return {
    list: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/players',
      handler: list.bind(null, season, division, player, player_role, role)
    },
    captains: {
      route: '/api/v1/seasons/:season_id/divisions/:division_id/captains',
      handler: captains.bind(null, season, division, player)
    }
  }
}
