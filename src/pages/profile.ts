import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SteamUserRepo, ProfileRepo, SeasonRepo, VouchRepo, TeamPlayerRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'
import type { from32to64, from64to32 } from '../lib/steamId'

type SteamIdLib = { from32to64: typeof from32to64; from64to32: typeof from64to32 }

async function view(
  templates: Templates, steam_user: SteamUserRepo, profile: ProfileRepo,
  season: SeasonRepo, vouch: VouchRepo, team_player: TeamPlayerRepo,
  steamId: SteamIdLib, player: import('../types/repos').PlayerRepo,
  req: Request, res: Response
): Promise<void> {
  try {
    let viewerHasPlayed: { has_played: boolean } | null = null
    if (req.user) {
      const viewer = await steam_user.getSteamUser(req.user.steamId)
      if (viewer) {
        viewerHasPlayed = await team_player.hasPlayed(viewer.steam_id)
      }
    }
    const active_season = await season.getActiveSeason()
    const _profile = await profile.getProfile(req.params.steam_id as string)
    if (!_profile) { res.sendStatus(404); return }
    const profileWithId64 = { ..._profile, id64: steamId.from32to64(_profile.steam_id) }
    const numberFalseActivity = active_season
      ? await player.hasFalseActivity(active_season.id, _profile.steam_id)
      : { count: '0' }
    const { has_played } = await team_player.hasPlayed(_profile.steam_id)
    const vouchResult = await vouch.isVouched(_profile.steam_id)
    const teamsPlayed = await team_player.getPlayerTeams(_profile.steam_id)
    const voucher = vouchResult?.voucher_id ? await profile.getProfile(vouchResult.voucher_id) : null
    const description = `RD2L Player ${_profile.name}\nPlayed on team(s): ${teamsPlayed.map(x => x.name).join(', ')}.`
    const html = templates.profile.view({
      description, user: req.user, profile: profileWithId64,
      active_season, vouched: vouchResult?.is_vouched ?? false, voucher,
      has_played, teamsPlayed, numSeasonsFalseActivity: numberFalseActivity.count,
      csrfToken: req.csrfToken?.(),
      can_vouch: (req.user && req.user.isAdmin) || (viewerHasPlayed && viewerHasPlayed.has_played)
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function edit(templates: Templates, steam_user: SteamUserRepo, profile: ProfileRepo, req: Request, res: Response): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const steamId = req.params.steam_id as string
  const themes = ['default', 'darkly', 'pulse', 'superhero', 'solar']
  try {
    const steamUser = await steam_user.getSteamUser(steamId)
    if (!steamUser) { res.sendStatus(404); return }
    if (!(req.user.isAdmin || req.user.steamId === steamUser.steam_id)) { res.sendStatus(403); return }
    const p = await profile.getProfile(steamUser.steam_id)
    const html = templates.profile.edit({
      user: req.user, steamUser, profile: p, themes, csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(steam_user: SteamUserRepo, profile: ProfileRepo, req: Request, res: Response): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  const p = {
    steam_id: req.body.steam_id,
    name: req.body.name,
    faceit_name: req.body.faceit_name,
    discord_name: req.body.discord_name,
    adjusted_mmr: Number.parseInt(req.body.adjusted_mmr),
    name_locked: req.body.name_locked === 'on',
    theme: req.body.theme
  }
  try {
    const steamUser = await steam_user.getSteamUser(p.steam_id)
    if (!steamUser) { res.sendStatus(404); return }
    if (!(req.user.isAdmin || req.user.steamId === steamUser.steam_id)) { res.sendStatus(403); return }
    const _profile = await profile.getProfile(steamUser.steam_id)
    if (!req.user.isAdmin) {
      p.adjusted_mmr = _profile ? _profile.adjusted_mmr : null as unknown as number
      p.name_locked = _profile ? _profile.name_locked : false
      if (p.name_locked) {
        p.name = _profile ? _profile.name : steamUser.name
      }
    }
    await profile.saveProfile(p)
    res.redirect('/profile/' + p.steam_id)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function vouch(templates: Templates, _steam_user: SteamUserRepo, profile: ProfileRepo, team_player: TeamPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  try {
    const voucher = await profile.getProfile(req.user.steamId)
    const vouchee = await profile.getProfile(req.params.steam_id as string)
    if (!voucher) { res.sendStatus(404); return }
    const { has_played } = await team_player.hasPlayed(voucher.steam_id)
    if (has_played || req.user.isAdmin) {
      const html = templates.profile.vouch_confirm({ user: req.user, voucher, vouchee })
      res.send(html)
    } else {
      res.sendStatus(403)
    }
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function confirm(_steam_user: SteamUserRepo, profile: ProfileRepo, _vouch: VouchRepo, team_player: TeamPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user) { res.sendStatus(403); return }
  try {
    const voucher = await profile.getProfile(req.user.steamId)
    const vouchee = await profile.getProfile(req.params.steam_id as string)
    if (!voucher || !vouchee) { res.sendStatus(404); return }
    const { has_played } = await team_player.hasPlayed(voucher.steam_id)
    if (has_played || req.user.isAdmin) {
      await _vouch.vouch(voucher.steam_id, vouchee.steam_id)
      res.redirect(`/profile/${vouchee.steam_id}`)
    } else {
      res.sendStatus(403)
    }
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function unvouch(profile: ProfileRepo, _vouch: VouchRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  try {
    const p = await profile.getProfile(req.params.steam_id as string)
    if (!p) { res.sendStatus(404); return }
    await _vouch.unvouch(p.steam_id)
    res.redirect(`/profile/${p.steam_id}`)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  templates: Templates, steam_user: SteamUserRepo, profile: ProfileRepo,
  season: SeasonRepo, team_player: TeamPlayerRepo, _vouch: VouchRepo,
  steamId: SteamIdLib, player: import('../types/repos').PlayerRepo
): Record<string, RouteDefinition> {
  return {
    view:    { route: '/profile/:steam_id',         handler: view.bind(null, templates, steam_user, profile, season, _vouch, team_player, steamId, player) },
    edit:    { route: '/profile/:steam_id/edit',    handler: edit.bind(null, templates, steam_user, profile) },
    post:    { route: '/profile/edit',              handler: post.bind(null, steam_user, profile) },
    vouch:   { route: '/profile/:steam_id/vouch',   handler: vouch.bind(null, templates, steam_user, profile, team_player) },
    confirm: { route: '/profile/:steam_id/confirm', handler: confirm.bind(null, steam_user, profile, _vouch, team_player) },
    unvouch: { route: '/profile/:steam_id/unvouch', handler: unvouch.bind(null, profile, _vouch) }
  }
}
