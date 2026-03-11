import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { SteamUser } from '../types/db'

async function getSteamUsers(db: Pool): Promise<SteamUser[]> {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.mmr,
    steam_user.rank_tier
  FROM
    steam_user
  `
  const result = await db.query(select)
  return result.rows
}

async function getSteamUsersMissingMMR(db: Pool, season_id: number | string): Promise<SteamUser[]> {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.mmr,
    steam_user.rank_tier
  FROM
    steam_user
  JOIN player ON
    steam_user.steam_id = player.steam_id
  WHERE
    player.season_id = ${season_id}
  AND
    steam_user.mmr = 0
  `
  const result = await db.query(select)
  return result.rows
}

async function getNonPlayerSteamUsers(db: Pool, season_id: number | string, division_id: number | string): Promise<SteamUser[]> {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.mmr,
    steam_user.rank_tier
  FROM
    steam_user
  WHERE
    steam_user.steam_id NOT IN (
      SELECT
        steam_user.steam_id
      FROM
        steam_user
      JOIN player ON
        player.steam_id = steam_user.steam_id
      WHERE
        player.season_id = ${season_id}
      AND
        player.division_id = ${division_id}
    )
  ORDER BY
    steam_user.name ASC,
    steam_user.steam_id ASC
  `
  const result = await db.query(select)
  return result.rows
}

async function getSteamUser(db: Pool, steamId: string): Promise<SteamUser | undefined> {
  const select = sql`
  SELECT
    steam_user.steam_id,
    steam_user.name,
    steam_user.avatar,
    steam_user.mmr,
    steam_user.rank_tier
  FROM
    steam_user
  WHERE
    steam_user.steam_id = ${steamId}
  `
  const result = await db.query(select)
  return result.rows[0]
}

async function saveSteamUser(db: Pool, user: SteamUser): Promise<unknown> {
  const upsert = sql`
  INSERT INTO steam_user (
    steam_id,
    name,
    avatar,
    mmr,
    rank_tier
  ) VALUES (
    ${user.steam_id},
    ${user.name},
    ${user.avatar},
    ${user.mmr},
    ${user.rank_tier}
  )
  ON CONFLICT (
    steam_id
  ) DO UPDATE SET (
    name,
    avatar,
    mmr,
    rank_tier
  ) = (
    ${user.name},
    ${user.avatar},
    ${user.mmr},
    ${user.rank_tier}
  )
  `
  return db.query(upsert)
}

async function deleteSteamUser(db: Pool, id: string): Promise<unknown> {
  const query = sql`
  DELETE FROM
    steam_user
  WHERE
    steam_id = ${id}
  `
  return db.query(query)
}

export = function(db: Pool) {
  return {
    getSteamUsers: getSteamUsers.bind(null, db),
    getSteamUsersMissingMMR: getSteamUsersMissingMMR.bind(null, db),
    getNonPlayerSteamUsers: getNonPlayerSteamUsers.bind(null, db),
    getSteamUser: getSteamUser.bind(null, db),
    saveSteamUser: saveSteamUser.bind(null, db),
    deleteSteamUser: deleteSteamUser.bind(null, db)
  }
}
