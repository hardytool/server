import type { Request, Response } from 'express'
import type { SeasonRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function save(season: SeasonRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const body = req.body as Record<string, unknown>
  try {
    await season.saveSeason(body)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(season: SeasonRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { id } = req.params as { id: string }
  try {
    await season.deleteSeason(id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(season: SeasonRepo): Record<string, RouteDefinition> {
  return {
    save: {
      route: '/api/v1/seasons',
      handler: save.bind(null, season),
    },
    remove: {
      route: '/api/v1/seasons/:id',
      handler: remove.bind(null, season),
    },
  }
}
