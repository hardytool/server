import type { Request, Response } from 'express'
import type { DivisionRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function listAll(division: DivisionRepo, _req: Request, res: Response): Promise<void> {
  try {
    const divisions = await division.getDivisions()
    res.json(divisions)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function save(division: DivisionRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const body = req.body as Record<string, unknown>
  try {
    await division.saveDivision(body)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(division: DivisionRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { id } = req.params as { id: string }
  try {
    await division.deleteDivision(id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(division: DivisionRepo): Record<string, RouteDefinition> {
  return {
    listAll: {
      route: '/api/v1/divisions/all',
      handler: listAll.bind(null, division),
    },
    save: {
      route: '/api/v1/divisions',
      handler: save.bind(null, division),
    },
    remove: {
      route: '/api/v1/divisions/:id',
      handler: remove.bind(null, division),
    },
  }
}
