import { nanoid } from 'nanoid'
import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { AdminGroupRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function list(templates: Templates, admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  try {
    const admin_groups = await admin_group.getAdminGroups()
    const html = templates.admin_group.list({ user: req.user, admin_groups })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function create(templates: Templates, admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const admin_groups = await admin_group.getAdminGroupNames()
  const html = templates.admin_group.edit({
    user: req.user,
    verb: 'Create',
    admin_groups,
    csrfToken: req.csrfToken?.()
  })
  res.send(html)
}

async function edit(templates: Templates, admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const admin_group_id = req.params.admin_group_id as string
  try {
    const [selected_admin_group] = await admin_group.getAdminGroups({ admin_group_id })
    const admin_groups = await admin_group.getAdminGroupNames()
    const html = templates.admin_group.edit({
      user: req.user,
      verb: 'Edit',
      selected_admin_group,
      admin_groups,
      csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(templates: Templates, admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const verb = req.body.id ? 'Edit' : 'Create'
  const id = req.body.id ? req.body.id : nanoid()
  const r = req.body
  r.id = id
  if (req.body.owner_id === '') {
    req.body.owner_id = null
  }
  try {
    await admin_group.saveAdminGroup(req.body)
    res.redirect('/admin_groups')
  } catch (err) {
    console.error(err)
    try {
      const admin_groups = await admin_group.getAdminGroupNames()
      const html = templates.admin_group.edit({
        user: req.user,
        verb,
        selected_admin_group: r,
        admin_groups,
        csrfToken: req.csrfToken?.(),
        error: err instanceof Error ? err.message : 'Failed to save admin group'
      })
      res.status(400).send(html)
    } catch (renderErr) {
      console.error(renderErr)
      res.sendStatus(500)
    }
  }
}

async function remove(admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const id = req.body.id
  try {
    await admin_group.deleteAdminGroup(id)
    res.redirect('/admin_groups')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(templates: Templates, admin_group: AdminGroupRepo): Record<string, RouteDefinition> {
  return {
    list:   { route: '/admin_groups',                          handler: list.bind(null, templates, admin_group) },
    create: { route: '/admin_groups/create',                   handler: create.bind(null, templates, admin_group) },
    edit:   { route: '/admin_groups/:admin_group_id/edit',     handler: edit.bind(null, templates, admin_group) },
    post:   { route: '/admin_groups/edit',                     handler: post.bind(null, templates, admin_group) },
    remove: { route: '/admin_groups/delete',                   handler: remove.bind(null, admin_group) }
  }
}
