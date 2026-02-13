import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { VouchStatus } from '../types/db'

async function isVouched(db: Pool, steam_id: string): Promise<VouchStatus | undefined> {
  const select = sql`
  SELECT
    CASE
      WHEN vouch.vouched_id IS NOT NULL THEN true
      ELSE false
    END AS is_vouched,
    vouch.voucher_id
  FROM
    steam_user
  LEFT JOIN vouch ON
    steam_user.steam_id = vouch.vouched_id
  WHERE
    steam_user.steam_id = ${steam_id}
  `
  const result = await db.query(select)
  return result.rows[0]
}

async function vouch(db: Pool, voucher_id: string, vouchee_id: string): Promise<unknown> {
  const upsert = sql`
  INSERT INTO vouch (
    vouched_id,
    voucher_id
  ) VALUES (
    ${vouchee_id},
    ${voucher_id}
  )
  ON CONFLICT (
    vouched_id
  ) DO NOTHING
  `
  return db.query(upsert)
}

async function unvouch(db: Pool, steam_id: string): Promise<unknown> {
  const query = sql`
  DELETE FROM
    vouch
  WHERE
    vouched_id = ${steam_id}
  `
  return db.query(query)
}

export = function(db: Pool) {
  return {
    isVouched: isVouched.bind(null, db),
    vouch: vouch.bind(null, db),
    unvouch: unvouch.bind(null, db)
  }
}
