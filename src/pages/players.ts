import { nanoid } from 'nanoid'
import * as csv from '../lib/csv'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SeasonRepo, DivisionRepo, PlayerRepo, PlayerRoleRepo, RoleRepo, SteamUserRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function list(templates: Templates, season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, req: Request, res: Response): Promise<void> {
  const includeCaptains = req.query.includeCaptains === '1' || req.query.includeCaptains === 'true'
  const includeStandins = req.query.includeStandins === '1' || req.query.includeStandins === 'true'
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const players = await player.getPlayers({
      season_id, division_id, is_captain: false, is_standin: false,
      hide_captains: !includeCaptains, hide_standins: !includeStandins
    })
    const captains = await player.getPlayers({ season_id, division_id, is_captain: true })
    const html = templates.player.list({
      user: req.user, season: s, division: d, players, noun: 'Players', cutoff: captains.length * 4
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function captains(templates: Templates, season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, req: Request, res: Response): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const normal = !(req.query.reverse_mmr && req.query.reverse_mmr === 'true')
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const players = await player.getPlayers(
      { season_id, division_id, is_captain: true },
      { by_mmr: normal, by_reverse_mmr: !normal }
    )
    const nonCaptains = await player.getPlayers({
      season_id, division_id, is_captain: false, is_standin: false, hide_captains: true, hide_standins: true
    })
    const canSupport = players.length * 4
    const leftoverPlayers = nonCaptains.length - canSupport
    const neededCaptains = Math.ceil(leftoverPlayers / 4)
    const html = templates.player.captains({
      user: req.user, season: s, division: d, players, neededCaptains, leftoverPlayers
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function standins(templates: Templates, season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, req: Request, res: Response): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    const players = await player.getPlayers({ season_id, division_id, is_standin: true }, { by_mmr: true })
    const html = templates.player.standins({ user: req.user, season: s, division: d, players })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function create(templates: Templates, season: SeasonRepo, division: DivisionRepo, steam_user: SteamUserRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const s = await season.getSeason(season_id)
    const divisions = await division.getDivisions()
    const d = await division.getDivision(division_id)
    const steamUsers = await steam_user.getNonPlayerSteamUsers(s.id, division_id)
    const html = templates.player.edit({
      user: req.user, verb: 'Create', season: s, division: d, divisions, steamUsers, csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function edit(templates: Templates, season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, _steam_user: SteamUserRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  const id = req.params.id as string
  try {
    const s = await season.getSeason(season_id)
    const divisions = await division.getDivisions()
    const d = await division.getDivision(division_id)
    const p = await player.getPlayer(id)
    const html = templates.player.edit({
      user: req.user, verb: 'Edit', player: p, season: s, division: d, divisions, csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(player: PlayerRepo, steam_user: SteamUserRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id ? req.body.id : nanoid()
  const p = req.body
  p.id = id
  p.captain_approved = p.captain_approved === 'on'
  p.statement = p.statement.slice(0, 500)
  p.is_draftable = p.is_draftable === 'on'
  try {
    await player.savePlayer(p)
    const steamUser = await steam_user.getSteamUser(p.steam_id)
    if (steamUser) {
      steamUser.party_mmr = req.body.party_mmr
      steamUser.solo_mmr = req.body.solo_mmr
      await steam_user.saveSteamUser(steamUser)
    }
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/players')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(player: PlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id
  try {
    await player.deletePlayer(id)
    res.redirect('/seasons/' + season_id + '/divisions/' + division_id + '/players')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function getCSV(player: PlayerRepo, player_role: PlayerRoleRepo, role: RoleRepo, division: DivisionRepo, req: Request, res: Response): Promise<void> {
  const isCaptains = req.query.captains === '1'
  const hideCaptains = req.query.show_captains !== '1'
  const byMMR = req.query.by_mmr === '1'
  const division_id = req.params.division_id as string
  const season_id = req.params.season_id as string
  try {
    const players = await player.getDraftSheet({
      season_id, division_id,
      is_captain: isCaptains,
      hide_captains: hideCaptains && !isCaptains
    }, { by_mmr: isCaptains || byMMR })
    const roleRanks = await player_role.getRoleRanks()
    const roles = await role.getRoles()
    const divisions = await division.getDivision(division_id)
    const playerRecords = players.map(p => {
      const playerRoleRanks = roleRanks.filter(rr => rr.player_id === p.id)
        .reduce<Record<string | number, number>>((acc, rr) => { acc[rr.role_id] = rr.rank; return acc }, {})
      const o = roles.reduce<Record<string, number | undefined>>((acc, r) => {
        acc['Role: ' + r.name] = playerRoleRanks[r.id]
        return acc
      }, {})
      const rest = { ...(p as unknown as Record<string, unknown>) }
      delete rest.id
      return { ...rest, ...o }
    })
    const csvData = await csv.toCSV(playerRecords as Record<string, unknown>[])
    if (!csvData) { res.sendStatus(204); return }
    let filename = divisions.name.toLowerCase() + '-'
    filename += isCaptains ? 'captains' : 'players'
    filename += '.csv'
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename)
    res.end(csvData)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function activityCheck(player: PlayerRepo, season: SeasonRepo, req: Request, res: Response): Promise<void> {
  try {
    const _season = await season.getActiveSeason()
    if (!_season) { res.sendStatus(500); return }
    let steam_id: string
    if (req.params.steam_id) {
      if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
      steam_id = req.params.steam_id as string
    } else {
      if (!req.user) { res.sendStatus(403); return }
      steam_id = req.user.steamId
    }
    await player.activityCheck(_season.id, steam_id)
    res.redirect('/profile/' + steam_id)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function json(player: PlayerRepo, _req: Request, res: Response): Promise<void> {
  const players = await player.getPlayers()
  res.send(players)
}

async function countJson(player: PlayerRepo, season: SeasonRepo, _req: Request, res: Response): Promise<void> {
  const seasons = await season.getActiveSeason()
  if (!seasons) { res.sendStatus(500); return }
  const players = await player.getCurrentPlayerCount(seasons.id)
  res.send(players)
}

export = function(templates: Templates, season: SeasonRepo, division: DivisionRepo, player: PlayerRepo, player_role: PlayerRoleRepo, role: RoleRepo, steam_user: SteamUserRepo): Record<string, RouteDefinition> {
  return {
    list:               { route: '/seasons/:season_id/divisions/:division_id/players',              handler: list.bind(null, templates, season, division, player) },
    captains:           { route: '/seasons/:season_id/divisions/:division_id/captains',             handler: captains.bind(null, templates, season, division, player) },
    standins:           { route: '/seasons/:season_id/divisions/:division_id/stand-ins',            handler: standins.bind(null, templates, season, division, player) },
    create:             { route: '/seasons/:season_id/divisions/:division_id/players/create',       handler: create.bind(null, templates, season, division, steam_user) },
    edit:               { route: '/seasons/:season_id/divisions/:division_id/players/:id/edit',     handler: edit.bind(null, templates, season, division, player, steam_user) },
    post:               { route: '/players/edit',                                                   handler: post.bind(null, player, steam_user) },
    remove:             { route: '/players/delete',                                                 handler: remove.bind(null, player) },
    csv:                { route: '/seasons/:season_id/divisions/:division_id/draftsheet',           handler: getCSV.bind(null, player, player_role, role, division) },
    activityCheck:      { route: '/players/activityCheck',                                          handler: activityCheck.bind(null, player, season) },
    activityCheckAdmin: { route: '/players/activityCheck/:steam_id',                               handler: activityCheck.bind(null, player, season) },
    json:               { route: '/players/json',                                                   handler: json.bind(null, player) },
    countJson:          { route: '/players/divisionCount',                                          handler: countJson.bind(null, player, season) }
  }
}
