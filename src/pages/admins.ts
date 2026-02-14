import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { AdminRepo, DivisionRepo, AdminGroupRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

async function create(templates: Templates, division: DivisionRepo, admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const divisions = await division.getDivisions()
  const admin_groups = await admin_group.getAdminGroups()
  const html = templates.admin.edit({
    user: req.user,
    verb: 'Create',
    divisions,
    admin_groups,
    csrfToken: req.csrfToken?.()
  })
  res.send(html)
}

async function list(templates: Templates, admin: AdminRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  try {
    const admins = await admin.getAdmins()
    const html = templates.admin.list({ user: req.user, admins })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function edit(templates: Templates, admin: AdminRepo, division: DivisionRepo, admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  const steam_id = req.params.admin_id as string
  try {
    const [adminRow] = await admin.getAdmins({ steam_id })
    const divisions = await division.getDivisions()
    const admin_groups = await admin_group.getAdminGroups()
    const html = templates.admin.edit({
      user: req.user,
      verb: 'Edit',
      admin: adminRow,
      divisions,
      admin_groups,
      csrfToken: req.csrfToken?.()
    })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function post(admin: AdminRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  if (req.body.division_id === '') {
    req.body.division_id = null
  }
  try {
    await admin.saveAdmin(req.body)
    res.redirect('/admins')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function remove(admin: AdminRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  try {
    await admin.deleteAdmin(req.body.steam_id)
    res.redirect('/admins')
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(templates: Templates, admin: AdminRepo, division: DivisionRepo, admin_group: AdminGroupRepo): Record<string, RouteDefinition> {
  return {
    create: { route: '/admins/create',         handler: create.bind(null, templates, division, admin_group) },
    list:   { route: '/admins',                handler: list.bind(null, templates, admin) },
    edit:   { route: '/admins/:admin_id/edit', handler: edit.bind(null, templates, admin, division, admin_group) },
    post:   { route: '/admins/edit',           handler: post.bind(null, admin) },
    remove: { route: '/admins/delete',         handler: remove.bind(null, admin) }
  }
}
