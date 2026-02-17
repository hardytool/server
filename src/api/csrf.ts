import type { Request, Response } from 'express'
import type { RouteDefinition } from '../types/routes'

function csrf(req: Request, res: Response): void {
  res.json({ token: req.csrfToken?.() ?? '' })
}

export = function(): Record<string, RouteDefinition> {
  return {
    csrf: { route: '/api/v1/csrf', handler: csrf },
  }
}
