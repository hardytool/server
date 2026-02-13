import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { Season } from '../types/db'

async function getSeasons(db: Pool): Promise<Season[]> {
  const select = sql`
  SELECT
    id,
    number,
    name,
    active,
    activity_check,
    registration_open
  FROM
    season
  ORDER BY
    number ASC
  `
  const result = await db.query(select)
  return result.rows
}

async function getSeason(db: Pool, id: number | string): Promise<Season> {
  const select = sql`
  SELECT
    id,
    number,
    name,
    active,
    activity_check,
    registration_open
  FROM
    season
  WHERE
    id = ${id}
  `
  const result = await db.query(select)
  return result.rows[0]
}

async function getActiveSeason(db: Pool): Promise<Season | undefined> {
  const select = sql`
  SELECT
    id,
    number,
    name,
    active,
    activity_check,
    registration_open
  FROM
    season
  WHERE
    active
  `
  const result = await db.query(select)
  return result.rows[0]
}

async function saveSeason(db: Pool, season: Partial<Season>): Promise<unknown> {
  const upsert = sql`
  INSERT INTO
    season (
      id,
      number,
      name,
      active,
      activity_check,
      registration_open
    ) VALUES (
      ${season.id},
      ${season.number},
      ${season.name},
      ${season.active},
      ${season.activity_check},
      ${season.registration_open}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      number,
      name,
      active,
      activity_check,
      registration_open
    ) = (
      ${season.number},
      ${season.name},
      ${season.active},
      ${season.activity_check},
      ${season.registration_open}
    )
  `
  return db.query(upsert)
}

async function deleteSeason(db: Pool, id: number | string): Promise<unknown> {
  const query = sql`
  DELETE FROM
    season
  WHERE
    id = ${id}
  `
  return db.query(query)
}

async function startSeason(db: Pool, divisionIds: string[], seasonId: number | string): Promise<unknown> {
  const query = sql`
  INSERT INTO round(season_id, current_round, division_id)
  values(${seasonId}, 0, unnest(${divisionIds}::text[]))
  `
  return db.query(query)
}

export = function(db: Pool) {
  return {
    getSeasons: getSeasons.bind(null, db),
    getSeason: getSeason.bind(null, db),
    getActiveSeason: getActiveSeason.bind(null, db),
    saveSeason: saveSeason.bind(null, db),
    deleteSeason: deleteSeason.bind(null, db),
    startSeason: startSeason.bind(null, db)
  }
}
