import type { Request, Response } from 'express'
import type { ProfileRepo, SteamUserRepo, TeamPlayerRepo, VouchRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function view(
  profile: ProfileRepo, _steam_user: SteamUserRepo, team_player: TeamPlayerRepo, vouch: VouchRepo,
  req: Request, res: Response
): Promise<void> {
  const steam_id = req.params.steam_id as string
  try {
    const p = await profile.getProfile(steam_id)
    if (!p) { res.sendStatus(404); return }
    const vouchResult = await vouch.isVouched(steam_id)
    const teamsPlayed = await team_player.getPlayerTeams(steam_id)
    const { has_played } = await team_player.hasPlayed(steam_id)
    res.json({
      ...p,
      is_vouched: vouchResult?.is_vouched ?? false,
      voucher_id: vouchResult?.voucher_id ?? null,
      has_played,
      teams_played: teamsPlayed,
    })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function update(
  profile: ProfileRepo, steam_user: SteamUserRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const steam_id = req.params.steam_id as string
  try {
    const steamUser = await steam_user.getSteamUser(steam_id)
    if (!steamUser) { res.sendStatus(404); return }
    if (!(req.user.isAdmin || req.user.steamId === steamUser.steam_id)) {
      res.sendStatus(403); return
    }
    const existing = await profile.getProfile(steam_id)
    const body = req.body as {
      name?: string; faceit_name?: string; discord_name?: string
      adjusted_mmr?: number; name_locked?: boolean; theme?: string
    }
    const update = {
      steam_id,
      name: body.name ?? existing?.name ?? null,
      faceit_name: body.faceit_name ?? existing?.faceit_name ?? null,
      discord_name: body.discord_name ?? existing?.discord_name ?? null,
      adjusted_mmr: req.user.isAdmin ? (body.adjusted_mmr ?? existing?.adjusted_mmr ?? null) : (existing?.adjusted_mmr ?? null),
      name_locked: req.user.isAdmin ? (body.name_locked ?? existing?.name_locked ?? false) : (existing?.name_locked ?? false),
      theme: body.theme ?? existing?.theme ?? 'default',
    }
    if (!req.user.isAdmin && existing?.name_locked) {
      update.name = existing.name
    }
    await profile.saveProfile(update)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function addVouch(
  profile: ProfileRepo, team_player: TeamPlayerRepo, vouch: VouchRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const steam_id = req.params.steam_id as string
  try {
    const voucher = await profile.getProfile(req.user.steamId)
    const vouchee = await profile.getProfile(steam_id)
    if (!voucher || !vouchee) { res.sendStatus(404); return }
    const { has_played } = await team_player.hasPlayed(voucher.steam_id)
    if (!has_played && !req.user.isAdmin) { res.sendStatus(403); return }
    await vouch.vouch(voucher.steam_id, vouchee.steam_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function removeVouch(
  profile: ProfileRepo, vouch: VouchRepo,
  req: Request, res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const steam_id = req.params.steam_id as string
  try {
    const p = await profile.getProfile(steam_id)
    if (!p) { res.sendStatus(404); return }
    await vouch.unvouch(p.steam_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  profile: ProfileRepo, steam_user: SteamUserRepo,
  team_player: TeamPlayerRepo, vouch: VouchRepo
): Record<string, RouteDefinition> {
  return {
    view: {
      route: '/api/v1/profiles/:steam_id',
      handler: view.bind(null, profile, steam_user, team_player, vouch),
    },
    update: {
      route: '/api/v1/profiles/:steam_id',
      handler: update.bind(null, profile, steam_user),
    },
    addVouch: {
      route: '/api/v1/profiles/:steam_id/vouch',
      handler: addVouch.bind(null, profile, team_player, vouch),
    },
    removeVouch: {
      route: '/api/v1/profiles/:steam_id/vouch',
      handler: removeVouch.bind(null, profile, vouch),
    },
  }
}
