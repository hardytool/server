function list(templates, steam_user, ip_address, steamId, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  ip_address.getIPAddresses().then(addresses => {
    const ipGroups = Array.from(Object.entries(addresses.reduce((acc, ipUser) => {
      ipUser.steam_id64 = steamId.from32to64(ipUser.steam_id)
      if (acc[ipUser.ip] !== undefined) {
        acc[ipUser.ip].push(ipUser)
      } else {
        acc[ipUser.ip] = [ipUser]
      }
      return acc
    }, [])))
    ipGroups.sort((a, b) => {
      return b[1].length - a[1].length
    })
    const html = templates.admin.ips({
      user: req.user,
      ipGroups: ipGroups
    })
    res.send(html)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, steam_user, ip_address, steamId) => {
  return {
    list: {
      route: '/ips',
      handler: list.bind(null, templates, steam_user, ip_address, steamId),
    }
  }
}

