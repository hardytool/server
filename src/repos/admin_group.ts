import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { AdminGroup } from '../types/db'

async function getAdminGroups(db: Pool, criteria?: { admin_group_id?: number | string }): Promise<AdminGroup[]> {
  let select = sql`
  SELECT
    admin_group.id,
    admin_group.name,
    admin_group.owner_id
  FROM
    admin_group
  WHERE
  	1 = 1
  `
  if (criteria) {
    if (criteria.admin_group_id) {
      select = sql.join([select, sql`
      AND
        admin_group.id = ${criteria.admin_group_id}
      `])
    }
  }
  const result = await db.query(select)
  return result.rows
}

async function getAdminGroupNames(db: Pool): Promise<Pick<AdminGroup, 'id' | 'name'>[]> {
  const select = sql`
  SELECT
    admin_group.id,
    admin_group.name
  FROM
    admin_group
  `
  const result = await db.query(select)
  return result.rows
}

async function saveAdminGroup(db: Pool, admin_group: Partial<AdminGroup>): Promise<unknown> {
  const upsert = sql`
  INSERT INTO admin_group (
    id,
    name,
    owner_id
  ) VALUES (
    ${admin_group.id},
    ${admin_group.name},
    ${admin_group.owner_id}
  ) ON CONFLICT (
    id
  ) DO UPDATE SET
    name = ${admin_group.name},
    owner_id = ${admin_group.owner_id}
  `
  return db.query(upsert)
}

async function deleteAdminGroup(db: Pool, admin_group_id: number | string): Promise<unknown> {
  const query = sql`
  DELETE FROM
    admin_group
  WHERE
    admin_group.id = ${admin_group_id}
  `
  return db.query(query)
}

export = function(db: Pool) {
  return {
    getAdminGroups: getAdminGroups.bind(null, db),
    getAdminGroupNames: getAdminGroupNames.bind(null, db),
    saveAdminGroup: saveAdminGroup.bind(null, db),
    deleteAdminGroup: deleteAdminGroup.bind(null, db)
  }
}
