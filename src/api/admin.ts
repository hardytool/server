import type { Request, Response } from 'express'
import type { AdminRepo, AdminGroupRepo, BannedPlayerRepo, RoleRepo, IpAddressRepo } from '../types/repos'
import type { RouteDefinition } from '../types/routes'

// ---- Admins ----------------------------------------------------------------

async function listAdmins(admin: AdminRepo, _req: Request, res: Response): Promise<void> {
  try {
    const admins = await admin.getAdmins()
    res.json(admins)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function saveAdmin(admin: AdminRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { steam_id, group_id, division_id } = req.body as {
    steam_id: string; group_id?: string; division_id?: number | null
  }
  try {
    await admin.saveAdmin({ steam_id, group_id: group_id ?? '_', division_id: division_id ?? null })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function deleteAdmin(admin: AdminRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { steam_id } = req.params as { steam_id: string }
  try {
    await admin.deleteAdmin(steam_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

// ---- Admin groups ----------------------------------------------------------

async function listAdminGroups(admin_group: AdminGroupRepo, _req: Request, res: Response): Promise<void> {
  try {
    const groups = await admin_group.getAdminGroups()
    res.json(groups)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function saveAdminGroup(admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const body = req.body as { id?: number; name: string }
  try {
    await admin_group.saveAdminGroup(body)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function deleteAdminGroup(admin_group: AdminGroupRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { group_id } = req.params as { group_id: string }
  try {
    await admin_group.deleteAdminGroup(group_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

// ---- Banned players --------------------------------------------------------

async function listBanned(banned_player: BannedPlayerRepo, _req: Request, res: Response): Promise<void> {
  try {
    const banned = await banned_player.getBannedPlayers()
    res.json(banned)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function saveBanned(banned_player: BannedPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const body = req.body as Record<string, unknown>
  try {
    await banned_player.saveBannedPlayer(body)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function deleteBanned(banned_player: BannedPlayerRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { id } = req.params as { id: string }
  try {
    await banned_player.deleteBannedPlayer(id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

// ---- Roles -----------------------------------------------------------------

async function listRoles(role: RoleRepo, _req: Request, res: Response): Promise<void> {
  try {
    const roles = await role.getRoles()
    res.json(roles)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function saveRole(role: RoleRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const body = req.body as { id?: number; name: string }
  try {
    await role.saveRole(body)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

async function deleteRole(role: RoleRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  const { role_id } = req.params as { role_id: string }
  try {
    await role.deleteRole(role_id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

// ---- IP addresses ----------------------------------------------------------

async function listIps(ip_address: IpAddressRepo, req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.isAdmin) { res.sendStatus(403); return }
  try {
    const ips = await ip_address.getIPAddresses()
    res.json(ips)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(
  admin: AdminRepo, admin_group: AdminGroupRepo, banned_player: BannedPlayerRepo,
  role: RoleRepo, ip_address: IpAddressRepo
): Record<string, RouteDefinition> {
  return {
    listAdmins:       { route: '/api/v1/admins',                handler: listAdmins.bind(null, admin) },
    saveAdmin:        { route: '/api/v1/admins',                handler: saveAdmin.bind(null, admin) },
    deleteAdmin:      { route: '/api/v1/admins/:steam_id',      handler: deleteAdmin.bind(null, admin) },
    listAdminGroups:  { route: '/api/v1/admin-groups',          handler: listAdminGroups.bind(null, admin_group) },
    saveAdminGroup:   { route: '/api/v1/admin-groups',          handler: saveAdminGroup.bind(null, admin_group) },
    deleteAdminGroup: { route: '/api/v1/admin-groups/:group_id',handler: deleteAdminGroup.bind(null, admin_group) },
    listBanned:       { route: '/api/v1/banned-players',        handler: listBanned.bind(null, banned_player) },
    saveBanned:       { route: '/api/v1/banned-players',        handler: saveBanned.bind(null, banned_player) },
    deleteBanned:     { route: '/api/v1/banned-players/:id',    handler: deleteBanned.bind(null, banned_player) },
    listRoles:        { route: '/api/v1/roles',                 handler: listRoles.bind(null, role) },
    saveRole:         { route: '/api/v1/roles',                 handler: saveRole.bind(null, role) },
    deleteRole:       { route: '/api/v1/roles/:role_id',        handler: deleteRole.bind(null, role) },
    listIps:          { route: '/api/v1/ips',                   handler: listIps.bind(null, ip_address) },
  }
}
