import type { Request, Response } from 'express'
import type { Templates } from '../types/templates'
import type { SteamUserRepo, IpAddressRepo } from '../types/repos'
import type { IpAddress } from '../types/db'
import type { RouteDefinition } from '../types/routes'
import type { from32to64, from64to32 } from '../lib/steamId'

type SteamIdLib = { from32to64: typeof from32to64; from64to32: typeof from64to32 }

async function list(
  templates: Templates,
  _steam_user: SteamUserRepo,
  ip_address: IpAddressRepo,
  steamId: SteamIdLib,
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }
  try {
    const addresses = await ip_address.getIPAddresses()
    const minCount = (req.query.count ? Number.parseInt(req.query.count as string) : 1) || 0
    const grouped = addresses.reduce<Record<string, Array<IpAddress & { steam_id64: ReturnType<SteamIdLib['from32to64']> }>>>((acc, ipUser) => {
      const entry = { ...ipUser, steam_id64: steamId.from32to64(ipUser.steam_id) }
      if (acc[ipUser.ip] !== undefined) {
        acc[ipUser.ip].push(entry)
      } else {
        acc[ipUser.ip] = [entry]
      }
      return acc
    }, {})
    const ipGroups = Object.entries(grouped).filter(e => e[1].length > minCount)
    ipGroups.sort((a, b) => b[1].length - a[1].length)
    const html = templates.admin.ips({ user: req.user, ipGroups })
    res.send(html)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
}

export = function(templates: Templates, steam_user: SteamUserRepo, ip_address: IpAddressRepo, steamId: SteamIdLib): Record<string, RouteDefinition> {
  return {
    list: { route: '/ips', handler: list.bind(null, templates, steam_user, ip_address, steamId) }
  }
}
