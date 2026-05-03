import { nanoid } from 'nanoid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { RoleRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function list(templates: Templates, role: RoleRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  try {
    const roles = await role.getRoles()
    const html = templates.role.list({ user: req.user, roles })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

function create(templates: Templates, req: Request, res: Response): void {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const html = templates.role.edit({ user: req.user, verb: 'Create', csrfToken: req.csrfToken?.() })
  res.send(html)
}

async function edit(templates: Templates, role: RoleRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const role_id = req.params.role_id as string
  try {
    const [r] = await role.getRoles({ role_id })
    const html = templates.role.edit({ user: req.user, verb: 'Edit', role: r, csrfToken: req.csrfToken?.() })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(templates: Templates, role: RoleRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const verb = req.body.id ? 'Edit' : 'Create'
  const id = req.body.id ? req.body.id : nanoid()
  const r = req.body
  r.id = id
  try {
    await role.saveRole(req.body)
    res.redirect('/roles')
  } catch (err) {
    console.error(err)
    const html = templates.role.edit({
      user: req.user,
      verb,
      role: r,
      csrfToken: req.csrfToken?.(),
      error: err instanceof Error ? err.message : 'Failed to save role'
    })
    res.status(400).send(html)
  }
}

async function remove(role: RoleRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const id = req.body.id
  try {
    await role.deleteRole(id)
    res.redirect('/roles')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(templates: Templates, role: RoleRepo): Record<string, RouteDefinition> {
  return {
    list:   { route: '/roles',           handler: list.bind(null, templates, role) },
    create: { route: '/roles/create',    handler: create.bind(null, templates) },
    edit:   { route: '/roles/:role_id/edit', handler: edit.bind(null, templates, role) },
    post:   { route: '/roles/edit',      handler: post.bind(null, templates, role) },
    remove: { route: '/roles/delete',    handler: remove.bind(null, role) }
  }
}
