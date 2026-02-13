import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { Role } from '../types/db'

async function getRoles(db: Pool, criteria?: { role_id?: number | string }): Promise<Role[]> {
  let select = sql`
  SELECT
    role.id,
    role.name
  FROM
    role
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.role_id) {
      select = sql.join([select, sql`
      AND
        role.id = ${criteria.role_id}
      `])
    }
  }
  const result = await db.query(select)
  return result.rows
}

async function saveRole(db: Pool, role: Partial<Role>): Promise<unknown> {
  const upsert = sql`
  INSERT INTO role (
    id,
    name
  ) VALUES (
    ${role.id},
    ${role.name}
  ) ON CONFLICT (
    id
  ) DO UPDATE SET
    name = ${role.name}
  `
  return db.query(upsert)
}

async function deleteRole(db: Pool, role_id: number | string): Promise<unknown> {
  const query = sql`
  DELETE FROM
    role
  WHERE
    role.id = ${role_id}
  `
  return db.query(query)
}

export = function(db: Pool) {
  return {
    getRoles: getRoles.bind(null, db),
    saveRole: saveRole.bind(null, db),
    deleteRole: deleteRole.bind(null, db)
  }
}
