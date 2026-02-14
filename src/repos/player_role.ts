import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { PlayerRole } from '../types/db'

async function getRoleRanks(db: Pool, criteria?: { player_id?: number | string }): Promise<PlayerRole[]> {
  let select = sql`
  SELECT
    player_role.player_id,
    player_role.role_id,
    player_role.rank
  FROM
    player_role
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.player_id) {
      select = sql.join([select, sql`
      AND
        player_role.player_id = ${criteria.player_id}
      `])
    }
  }
  const result = await db.query(select)
  return result.rows
}

async function saveRoleRank(db: Pool, player_id: number | string, role_id: number | string, rank: number): Promise<unknown> {
  const upsert = sql`
  INSERT INTO player_role (
    player_id,
    role_id,
    rank
  ) VALUES (
    ${player_id},
    ${role_id},
    ${rank}
  ) ON CONFLICT (
    player_id,
    role_id
  ) DO UPDATE SET
    rank = ${rank}
  `
  return db.query(upsert)
}

export = function(db: Pool) {
  return {
    getRoleRanks: getRoleRanks.bind(null, db),
    saveRoleRank: saveRoleRank.bind(null, db)
  }
}
