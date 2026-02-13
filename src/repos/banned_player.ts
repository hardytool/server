import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { BannedPlayer } from '../types/db'

async function getBannedPlayers(db: Pool, criteria?: { banned_player_id?: number | string }): Promise<BannedPlayer[]> {
  let select = sql`
  SELECT
    banned_player.id,
    banned_player.steam_id,
    banned_player.name,
    banned_player.reason,
    banned_player.banned_until,
    banned_player.still_banned
  FROM
    banned_player
  WHERE
  	1 = 1
  `
  if (criteria) {
    if (criteria.banned_player_id) {
      select = sql.join([select, sql`
      AND
        banned_player.id = ${criteria.banned_player_id}
      `])
    }
  }
  const result = await db.query(select)
  return result.rows
}

async function saveBannedPlayer(db: Pool, banned_player: Partial<BannedPlayer>): Promise<unknown> {
  const upsert = sql`
  INSERT INTO banned_player (
    id,
    steam_id,
    name,
    reason,
    banned_until,
    still_banned
  ) VALUES (
    ${banned_player.id},
    ${banned_player.steam_id},
    ${banned_player.name},
    ${banned_player.reason},
    ${banned_player.banned_until},
    ${banned_player.still_banned}
  ) ON CONFLICT (
    id
  ) DO UPDATE SET
    steam_id = ${banned_player.steam_id},
    name = ${banned_player.name},
    reason = ${banned_player.reason},
    banned_until = ${banned_player.banned_until},
    still_banned = ${banned_player.still_banned}
  `
  return db.query(upsert)
}

async function deleteBannedPlayer(db: Pool, banned_player_id: number | string): Promise<unknown> {
  const query = sql`
  DELETE FROM
    banned_player
  WHERE
    banned_player.id = ${banned_player_id}
  `
  return db.query(query)
}

export = function(db: Pool) {
  return {
    getBannedPlayers: getBannedPlayers.bind(null, db),
    saveBannedPlayer: saveBannedPlayer.bind(null, db),
    deleteBannedPlayer: deleteBannedPlayer.bind(null, db)
  }
}
