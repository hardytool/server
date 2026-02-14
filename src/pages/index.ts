import fs from 'fs'
import MarkdownIt from 'markdown-it'
import classy from 'markdown-it-classy'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { RouteDefinition } from '../types/routes'

const md = new MarkdownIt({ linkify: true })
md.use(classy)

function home(templates: Templates, req: Request, res: Response): void {
  const html = templates.index({ user: req.user })
  res.send(html)
}

function complaint(templates: Templates, req: Request, res: Response): void {
  const html = templates.complaint({ user: req.user })
  res.send(html)
}

function rules(templates: Templates, path: string, req: Request, res: Response): void {
  fs.readFile(path, 'utf8', (_err, data) => {
    const rendered = md.render(data)
    const html = templates.rules({ user: req.user, rules: rendered })
    res.send(html)
  })
}

function playoffs(templates: Templates, req: Request, res: Response): void {
  const html = templates.playoffs({ user: req.user })
  res.send(html)
}

export = function(templates: Templates, path: string, irulespath: string): Record<string, RouteDefinition> {
  return {
    home:      { route: '/',             handler: home.bind(null, templates) },
    complaint: { route: '/complaint',    handler: complaint.bind(null, templates) },
    rules:     { route: '/rules',        handler: rules.bind(null, templates, path) },
    irules:    { route: '/inhouserules', handler: rules.bind(null, templates, irulespath) },
    playoffs:  { route: '/playoffs',     handler: playoffs.bind(null, templates) }
  }
}
