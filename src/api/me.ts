import type { Request, Response } from 'express'
import type { RouteDefinition } from '../types/routes'

function me(req: Request, res: Response): void {
  if (!req.user) {
    res.json({ loggedIn: false })
    return
  }
  res.json({
    loggedIn: true,
    steamId: req.user.steamId,
    displayName: req.user.displayName,
    avatar: req.user.avatar,
    isAdmin: req.user.isAdmin,
    activityCheckRequired: req.user.activityCheckRequired,
  })
}

export = function(): Record<string, RouteDefinition> {
  return {
    me: { route: '/api/v1/me', handler: me },
  }
}
