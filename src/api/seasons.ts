import type { Request, Response } from 'express'
import type { SeasonRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function list(season: SeasonRepo, _req: Request, res: Response): Promise<void> {
  try {
    const seasons = await season.getSeasons()
    res.json(seasons)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function view(season: SeasonRepo, req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  try {
    const s = await season.getSeason(id)
    res.json(s)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(season: SeasonRepo): Record<string, RouteDefinition> {
  return {
    list: {
      route: '/api/v1/seasons',
      handler: list.bind(null, season)
    },
    view: {
      route: '/api/v1/seasons/:id',
      handler: view.bind(null, season)
    }
  }
}
