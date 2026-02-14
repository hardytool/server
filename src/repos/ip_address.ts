import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { IpAddress } from '../types/db'

async function getIPAddresses(db: Pool): Promise<IpAddress[]> {
  const select = sql`
  SELECT
    ip_address.steam_id,
    ip_address.ip,
    steam_user.avatar,
    steam_user.name AS steam_name,
    profile.discord_name,
    COALESCE(profile.name, steam_user.name) AS name
  FROM
    ip_address
  JOIN steam_user ON
    steam_user.steam_id = ip_address.steam_id
  JOIN profile ON
    profile.steam_id = ip_address.steam_id
  `
  const result = await db.query(select)
  return result.rows
}

async function saveIPAddress(db: Pool, ip: string, steamId: string): Promise<unknown> {
  const insert = sql`
  INSERT INTO ip_address (
    ip,
    steam_id
  ) VALUES (
    ${ip},
    ${steamId}
  ) ON CONFLICT (
    ip,
    steam_id
  ) DO NOTHING
  `
  return db.query(insert)
}

export = function(db: Pool) {
  return {
    getIPAddresses: getIPAddresses.bind(null, db),
    saveIPAddress: saveIPAddress.bind(null, db)
  }
}
