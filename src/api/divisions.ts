import type { Request, Response } from 'express'
import type { DivisionRepo } from '../types/repos'
import type { AdminRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function list(division: DivisionRepo, _req: Request, res: Response): Promise<void> {
  try {
    const divisions = await division.getDivisions({ active: true })
    res.json(divisions)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function view(division: DivisionRepo, admin: AdminRepo, req: Request, res: Response): Promise<void> {
  const division_id = req.params.division_id as string
  try {
    const div = await division.getDivision(division_id)
    const divisionAdmins = await admin.getDivisionAdmins(division_id)
    res.json({
      ...div,
      admins: divisionAdmins
    })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(division: DivisionRepo, admin: AdminRepo): Record<string, RouteDefinition> {
  return {
    list: {
      route: '/api/v1/divisions',
      handler: list.bind(null, division)
    },
    view: {
      route: '/api/v1/divisions/:division_id',
      handler: view.bind(null, division, admin)
    }
  }
}
