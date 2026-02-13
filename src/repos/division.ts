import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { Division } from '../types/db'

async function getDivisions(db: Pool, criteria?: { active?: boolean }): Promise<Division[]> {
  let select = sql`
  SELECT
    division.id,
    division.name,
    division.active,
    division.discord_url,
    division.start_time,
    division.draft_sheet_url
  FROM
    division
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.active !== undefined) {
      select = sql.join([select, sql`
      AND
        division.active = ${criteria.active}
      `])
    }
  }
  select = sql.join([select, sql`
  ORDER BY
    name ASC
  `])
  const result = await db.query(select)
  return result.rows
}

async function getDivision(db: Pool, id: number | string): Promise<Division> {
  const select = sql`
  SELECT
    division.id,
    division.name,
    division.active,
    division.discord_url,
    division.start_time,
    division.draft_sheet_url
  FROM
    division
  WHERE
    division.id = ${id}
  `
  const result = await db.query(select)
  return result.rows[0]
}

async function saveDivision(db: Pool, division: Partial<Division>): Promise<unknown> {
  const upsert = sql`
  INSERT INTO
    division(
      id,
      name,
      active,
      discord_url,
      start_time,
      draft_sheet_url
    ) VALUES (
      ${division.id},
      ${division.name},
      ${division.active},
      ${division.discord_url},
      ${division.start_time},
      ${division.draft_sheet_url}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      name,
      active,
      discord_url,
      start_time,
      draft_sheet_url
    ) = (
      ${division.name},
      ${division.active},
      ${division.discord_url},
      ${division.start_time},
      ${division.draft_sheet_url}
    )
  `
  return db.query(upsert)
}

async function deleteDivision(db: Pool, id: number | string): Promise<unknown> {
  const query = sql`
  DELETE FROM
    division
  WHERE
    id = ${id}
  `
  return db.query(query)
}

export = function(db: Pool) {
  return {
    getDivisions: getDivisions.bind(null, db),
    getDivision: getDivision.bind(null, db),
    saveDivision: saveDivision.bind(null, db),
    deleteDivision: deleteDivision.bind(null, db)
  }
}
