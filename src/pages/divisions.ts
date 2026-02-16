import { nanoid } from 'nanoid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { DivisionRepo, SeasonRepo, AdminRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function listAll(templates: Templates, division: DivisionRepo, req: Request, res: Response): Promise<void> {
  try {
    const divisions = await division.getDivisions()
    const html = templates.division.list({ user: req.user, divisions })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function list(templates: Templates, division: DivisionRepo, req: Request, res: Response): Promise<void> {
  try {
    const divisions = await division.getDivisions({ active: true })
    const html = templates.division.list({ user: req.user, divisions })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function nav(templates: Templates, season: SeasonRepo, division: DivisionRepo, admin: AdminRepo, req: Request, res: Response): Promise<void> {
  const division_id = req.params.division_id as string
  try {
    const div = await division.getDivision(division_id)
    const divisionAdmins = await admin.getDivisionAdmins(division_id)
    const seasons = await season.getActiveSeason()
    const html = templates.division.division({
      user: req.user,
      division: div,
      seasons,
      divisionAdmins
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function all_seasons(templates: Templates, season: SeasonRepo, division: DivisionRepo, req: Request, res: Response): Promise<void> {
  const division_id = req.params.division_id as string
  try {
    const div = await division.getDivision(division_id)
    const seasons = await season.getSeasons()
    const html = templates.division.all_seasons({
      user: req.user,
      division: div,
      seasons: seasons.toReversed()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

function create(templates: Templates, req: Request, res: Response): void {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const html = templates.division.edit({
    user: req.user,
    verb: 'Create',
    csrfToken: req.csrfToken?.()
  })
  res.send(html)
}

async function edit(templates: Templates, division: DivisionRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const id = req.params.id as string
  try {
    const div = await division.getDivision(id)
    const html = templates.division.edit({
      user: req.user,
      verb: 'Edit',
      division: div,
      csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(division: DivisionRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const d = req.body
  const id = d.id ? d.id : nanoid()
  d.id = id
  d.active = d.active === 'on'
  try {
    await division.saveDivision(d)
    res.redirect('/divisions')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(division: DivisionRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  try {
    await division.deleteDivision(req.body.id)
    res.redirect('/divisions')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(templates: Templates, season: SeasonRepo, division: DivisionRepo, admin: AdminRepo): Record<string, RouteDefinition> {
  return {
    list:       { route: '/divisions',                      handler: list.bind(null, templates, division) },
    listAll:    { route: '/divisionsAll',                   handler: listAll.bind(null, templates, division) },
    nav:        { route: '/divisions/:division_id',         handler: nav.bind(null, templates, season, division, admin) },
    all_seasons:{ route: '/divisions/:division_id/all_seasons', handler: all_seasons.bind(null, templates, season, division) },
    create:     { route: '/divisions/create',               handler: create.bind(null, templates) },
    edit:       { route: '/divisions/:id/edit',             handler: edit.bind(null, templates, division) },
    post:       { route: '/divisions/edit',                 handler: post.bind(null, division) },
    remove:     { route: '/divisions/delete',               handler: remove.bind(null, division) }
  }
}
