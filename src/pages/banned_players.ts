import shortid from 'shortid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { BannedPlayerRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

function create(templates: Templates, req: Request, res: Response): void {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const html = templates.banned_player.edit({
    user: req.user,
    verb: 'Create',
    csrfToken: req.csrfToken?.()
  })
  res.send(html)
}

async function list(templates: Templates, banned_player: BannedPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  try {
    const bannedPlayers = await banned_player.getBannedPlayers()
    const html = templates.banned_player.list({ user: req.user, banned_players: bannedPlayers })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function edit(templates: Templates, banned_player: BannedPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const banned_player_id = req.params.id as string
  try {
    const [bannedPlayer] = await banned_player.getBannedPlayers({ banned_player_id })
    const html = templates.banned_player.edit({
      user: req.user,
      verb: 'Edit',
      banned_players: bannedPlayer,
      csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(banned_player: BannedPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const id = req.body.id ? req.body.id : shortid.generate()
  if (req.body.still_banned == null) {
    req.body.still_banned = false
  }
  req.body.id = id
  try {
    await banned_player.saveBannedPlayer(req.body)
    res.redirect('/banned_players')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(banned_player: BannedPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  try {
    await banned_player.deleteBannedPlayer(req.body.id)
    res.redirect('/banned_players')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(templates: Templates, banned_player: BannedPlayerRepo): Record<string, RouteDefinition> {
  return {
    create: { route: '/banned_players/create',      handler: create.bind(null, templates) },
    list:   { route: '/banned_players',             handler: list.bind(null, templates, banned_player) },
    edit:   { route: '/banned_players/:id/edit',    handler: edit.bind(null, templates, banned_player) },
    post:   { route: '/banned_players/edit',        handler: post.bind(null, banned_player) },
    remove: { route: '/banned_players/delete',      handler: remove.bind(null, banned_player) }
  }
}
