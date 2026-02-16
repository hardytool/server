import fs from 'fs'
import MarkdownIt from 'markdown-it'
import classy from 'markdown-it-classy'
import type { Request, Response } from 'express'
import type { RouteDefinition } from '../types/routes'

const md = new MarkdownIt({ linkify: true })
md.use(classy)

function renderMarkdown(filePath: string, _req: Request, res: Response): void {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) { res.sendStatus(404); return }
    res.json({ html: md.render(data) })
  })
}

export = function(rulesPath: string, inhouseRulesPath: string): Record<string, RouteDefinition> {
  return {
    rules: {
      route: '/api/v1/rules',
      handler: renderMarkdown.bind(null, rulesPath),
    },
    inhouseRules: {
      route: '/api/v1/inhouserules',
      handler: renderMarkdown.bind(null, inhouseRulesPath),
    },
  }
}
