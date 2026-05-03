import { nanoid } from 'nanoid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SeasonRepo, DivisionRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function list(templates: Templates, season: SeasonRepo, req: Request, res: Response): Promise<void> {
  try {
    const seasons = await season.getSeasons()
    const html = templates.season.list({ user: req.user, seasons: seasons.toReversed() })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

function create(templates: Templates, req: Request, res: Response): void {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const html = templates.season.edit({ user: req.user, verb: 'Create', csrfToken: req.csrfToken?.() })
  res.send(html)
}

async function edit(templates: Templates, season: SeasonRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const id = req.params.id as string
  try {
    const s = await season.getSeason(id)
    const html = templates.season.edit({ user: req.user, verb: 'Edit', season: s, csrfToken: req.csrfToken?.() })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function start(_templates: Templates, season: SeasonRepo, division: DivisionRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const season_id = req.params.id as string
  try {
    const divisions = await division.getDivisions()
    const divisionIds = divisions.map(d => d.id)
    await season.startSeason(divisionIds, season_id)
    res.redirect('/seasons')
  } catch (err) {
    console.error(err)
    res.status(500).send({ status: 500, message: 'Error Starting Season', error: err })
  }
}

async function post(templates: Templates, season: SeasonRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const verb = req.body.id ? 'Edit' : 'Create'
  const s = req.body
  const id = s.id ? s.id : nanoid()
  s.id = id
  s.active = s.active == 'on' ? true : false
  s.registration_open = s.registration_open == 'on' ? true : false
  s.activity_check = s.activity_check == 'on' ? true : false
  try {
    await season.saveSeason(s)
    res.redirect('/seasons')
  } catch (err) {
    console.error(err)
    const html = templates.season.edit({
      user: req.user,
      verb,
      season: s,
      csrfToken: req.csrfToken?.(),
      error: err instanceof Error ? err.message : 'Failed to save season'
    })
    res.status(400).send(html)
  }
}

async function remove(season: SeasonRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  try {
    await season.deleteSeason(req.body.id)
    res.redirect('/seasons')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(templates: Templates, season: SeasonRepo, division: DivisionRepo): Record<string, RouteDefinition> {
  return {
    list:   { route: '/seasons',          handler: list.bind(null, templates, season) },
    create: { route: '/seasons/create',   handler: create.bind(null, templates) },
    edit:   { route: '/seasons/:id/edit', handler: edit.bind(null, templates, season) },
    post:   { route: '/seasons/edit',     handler: post.bind(null, templates, season) },
    remove: { route: '/seasons/delete',   handler: remove.bind(null, season) },
    start:  { route: '/seasons/:id/start', handler: start.bind(null, templates, season, division) }
  }
}
