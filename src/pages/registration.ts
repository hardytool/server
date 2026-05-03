import { nanoid } from 'nanoid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SeasonRepo, DivisionRepo, SteamUserRepo, TeamPlayerRepo, PlayerRepo, RoleRepo, PlayerRoleRepo, ProfileRepo, ProfileInput } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function view(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  steam_user: SteamUserRepo, player: PlayerRepo, role: RoleRepo,
  player_role: PlayerRoleRepo, profile: ProfileRepo,
  req: Request, res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  const division_id = req.params.division_id as string
  try {
    const s = await season.getSeason(season_id)
    if (!req.user) {
      const html = templates.error.unauthenticated({
        user: req.user,
        error: `Please log in to be able to register for ${s.name}`
      })
      res.send(html)
      return
    }
    const d = await division.getDivision(division_id)
    if (!d.active) {
      const html = templates.error.division_inactive({
        user: req.user,
        error: `${d.name} is inactive, registration is unavailable.`
      })
      res.send(html)
      return
    }
    const steamUser = await steam_user.getSteamUser(req.user.steamId)
    if (!steamUser) { res.sendStatus(404); return }
    const [existingPlayer] = await player.getPlayers({
      season_id: s.id,
      division_id: d.id,
      steam_id: steamUser.steam_id
    })
    const roles = await role.getRoles()
    if (existingPlayer) {
      const ranks = await player_role.getRoleRanks({ player_id: existingPlayer.id })
      const prefs = roles.reduce<Record<string, number>>((acc, r) => {
        const rank = ranks.filter(rr => rr.role_id === r.id)
        if (rank.length) {
          acc[r.id] = rank[0].rank
        }
        return acc
      }, {})
      const html = templates.registration.edit({
        user: req.user,
        steamUser,
        division: d,
        season: s,
        player: existingPlayer,
        roles,
        ranks: prefs,
        csrfToken: req.csrfToken?.()
      })
      res.send(html)
      return
    }
    await steam_user.saveSteamUser(steamUser)
    const p = (await profile.getProfile(steamUser.steam_id) || {}) as Record<string, unknown>
    p.name = p.name || steamUser.name
    p.adjusted_mmr = p.adjusted_mmr
      || (steamUser.solo_mmr > steamUser.party_mmr
        ? steamUser.solo_mmr
        : steamUser.party_mmr)
    p.is_draftable = p.is_draftable === undefined ? true : p.is_draftable
    const html = templates.registration.edit({
      user: req.user,
      season: s,
      division: d,
      steamUser,
      player: p,
      roles,
      ranks: [],
      csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function shortcut(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  steam_user: SteamUserRepo, player: PlayerRepo, role: RoleRepo,
  player_role: PlayerRoleRepo, profile: ProfileRepo,
  req: Request, res: Response
): Promise<void> {
  try {
    const _season = await season.getActiveSeason()
    if (!_season) { res.sendStatus(500); return }
    req.params.season_id = String(_season.id)
    return view(templates, season, division, steam_user, player, role, player_role, profile, req, res)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function directory(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  steam_user: SteamUserRepo, player: PlayerRepo,
  req: Request, res: Response
): Promise<void> {
  const season_id = req.params.season_id as string
  try {
    const s = await season.getSeason(season_id)
    if (!req.user) {
      const html = templates.error.unauthenticated({
        user: req.user,
        error: `Please log in to be able to register for ${s.name}`
      })
      res.send(html)
      return
    }
    const divisions = await division.getDivisions({ active: true })
    if (divisions.length === 0) {
      const html = templates.error.no_divisions({
        user: req.user,
        error: 'There don\'t appear to be any active divisions. Ping an admin.'
      })
      res.send(html)
      return
    }
    const steamUser = await steam_user.getSteamUser(req.user.steamId)
    if (!steamUser) { res.sendStatus(404); return }
    const players = await player.getPlayers({
      season_id: s.id,
      steam_id: steamUser.steam_id
    })
    const divisionsWithRegistered = divisions.map(d => ({
      ...d,
      registered: players.map(p => p.division_id).includes(d.id)
    }))
    const html = templates.registration.directory({
      user: req.user,
      season: s,
      divisions: divisionsWithRegistered
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function directoryShortcut(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  steam_user: SteamUserRepo, player: PlayerRepo,
  req: Request, res: Response
): Promise<void> {
  try {
    const _season = await season.getActiveSeason()
    if (_season) {
      req.params.season_id = String(_season.id)
      return directory(templates, season, division, steam_user, player, req, res)
    } else {
      const html = templates.error.no_seasons({ user: req.user })
      res.send(html)
    }
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  steam_user: SteamUserRepo, team_player: TeamPlayerRepo, player: PlayerRepo,
  role: RoleRepo, player_role: PlayerRoleRepo, profile: ProfileRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const id = req.body.id ? req.body.id : nanoid()
  const p = req.body
  p.id = id
  p.steam_id = req.user.steamId
  p.captain_approved = false
  p.activity_check = false
  p.statement = p.statement.slice(0, 500)
  p.is_draftable = !(p.standin_only === 'on')
  delete p.standin_only
  try {
    const s = await season.getSeason(season_id)
    const d = await division.getDivision(division_id)
    if (!d.active) {
      throw new Error('Division inactive')
    }
    const steamUser = await steam_user.getSteamUser(req.user.steamId)
    if (!steamUser) { res.sendStatus(404); return }
    steamUser.solo_mmr = p.solo_mmr
    steamUser.party_mmr = p.party_mmr
    const _profile = await profile.getProfile(steamUser.steam_id)
    if (!_profile) { res.sendStatus(404); return }
    _profile.discord_name = req.body.discord_name
    const { allowed } = await team_player.isCaptainAutoApproved(steamUser.steam_id)
    p.captain_approved = allowed
    let playerAllowed: boolean
    try {
      const pl = await player.getPlayer(p.id)
      if (pl) {
        p.captain_approved = pl.captain_approved
        p.activity_check = pl.activity_check
        if (s.activity_check == true) {
          p.activity_check = true
        }
        playerAllowed = pl.steam_id === req.user.steamId
      } else {
        playerAllowed = true
      }
    } catch {
      playerAllowed = true
    }
    if (!playerAllowed) {
      throw new Error('Access forbidden')
    }
    if (s.activity_check == true) {
      p.activity_check = true
    }
    await steam_user.saveSteamUser(steamUser)
    await player.savePlayer(p)
    await profile.saveProfile(_profile as unknown as ProfileInput)
    const roles = await role.getRoles()
    const promises = roles.reduce<Promise<unknown>[]>((acc, r) => {
      if (p[r.id] !== undefined) {
        acc.push(player_role.saveRoleRank(p.id, r.id, p[r.id]))
      }
      return acc
    }, [])
    await Promise.all(promises)
    const html = templates.registration.discord({
      user: req.user,
      season: s,
      division: d
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    try {
      const s = await season.getSeason(season_id)
      const d = await division.getDivision(division_id)
      const steamUser = await steam_user.getSteamUser(req.user.steamId)
      if (!steamUser) { res.sendStatus(500); return }
      const roles = await role.getRoles()
      const ranks = roles.reduce<Record<string, number>>((acc, r) => {
        if (p[r.id] !== undefined) {
          acc[r.id] = Number(p[r.id])
        }
        return acc
      }, {})
      const html = templates.registration.edit({
        user: req.user,
        steamUser,
        season: s,
        division: d,
        player: p,
        roles,
        ranks,
        csrfToken: req.csrfToken?.(),
        error: err instanceof Error ? err.message : 'Failed to register'
      })
      res.status(400).send(html)
    } catch (renderErr) {
      console.error(renderErr)
      res.sendStatus(500)
    }
  }
}

async function unregister(
  season: SeasonRepo, division: DivisionRepo,
  steam_user: SteamUserRepo, player: PlayerRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const seasonId = req.body.season_id
  const divisionId = req.body.division_id
  const steamId = req.user.steamId
  try {
    const s = await season.getSeason(seasonId)
    const d = await division.getDivision(divisionId)
    const steamUser = await steam_user.getSteamUser(steamId)
    if (!steamUser) { res.sendStatus(404); return }
    await player.unregisterPlayer(s.id, d.id, steamUser.steam_id)
    res.redirect('/seasons/' + s.id + '/divisions/' + d.id + '/players')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  templates: Templates, season: SeasonRepo, division: DivisionRepo,
  steam_user: SteamUserRepo, team_player: TeamPlayerRepo, player: PlayerRepo,
  role: RoleRepo, player_role: PlayerRoleRepo, profile: ProfileRepo
): Record<string, RouteDefinition> {
  return {
    view:              { route: '/seasons/:season_id/divisions/:division_id/register', handler: view.bind(null, templates, season, division, steam_user, player, role, player_role, profile) },
    shortcut:          { route: '/divisions/:division_id/register',                   handler: shortcut.bind(null, templates, season, division, steam_user, player, role, player_role, profile) },
    directory:         { route: '/seasons/:season_id/register',                       handler: directory.bind(null, templates, season, division, steam_user, player) },
    directoryShortcut: { route: '/register',                                          handler: directoryShortcut.bind(null, templates, season, division, steam_user, player) },
    post:              { route: '/register',                                          handler: post.bind(null, templates, season, division, steam_user, team_player, player, role, player_role, profile) },
    unregister:        { route: '/register/delete',                                   handler: unregister.bind(null, season, division, steam_user, player) }
  }
}
