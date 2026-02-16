import type { Request, Response } from 'express'
import type { RouteDefinition } from '../types/routes'

type CsrfTokenGenerator = (req: Request, res: Response) => string

function csrfToken(generateCsrfToken: CsrfTokenGenerator, req: Request, res: Response): void {
  res.json({ token: generateCsrfToken(req, res) })
}

export = function(generateCsrfToken: CsrfTokenGenerator): Record<string, RouteDefinition> {
  return {
    csrfToken: {
      route: '/api/v1/csrf-token',
      handler: csrfToken.bind(null, generateCsrfToken),
    },
  }
}
