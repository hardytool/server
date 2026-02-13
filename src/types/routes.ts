// ---------------------------------------------------------------------------
// Route definition — the shape exported by every page and API controller
// ---------------------------------------------------------------------------
import type { RequestHandler } from 'express'

// Every route exported from pages/* and api/* has this shape:
//
//   module.exports = (deps...) => ({
//     someRoute: {
//       route: '/path/:param',
//       handler: (req, res) => { ... }
//     }
//   })
//
export interface RouteDefinition {
  route: string
  handler: RequestHandler
}
