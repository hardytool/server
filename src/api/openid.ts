import type { Request, Response } from 'express'
import type { Config } from '../types/config'

function steamIdReturn(config: Config, _req: Request, res: Response): void {
  if (!config.server.website_url) {
    res.redirect('/')
  } else {
    res.redirect(config.server.website_url)
  }
}

function logout(config: Config, req: Request, res: Response): void {
  if (req.user) {
    req.logout(() => {
      if (!config.server.website_url) {
        res.redirect('/')
      } else {
        res.redirect(config.server.website_url as string)
      }
    })
  }
}

export = function(config: Config) {
  return {
    steamIdReturn: steamIdReturn.bind(null, config),
    logout: logout.bind(null, config)
  }
}
