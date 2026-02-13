import fs from 'fs'
import path from 'path'
import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { Migration } from '../types/db'

function getMigrations(directory: string): Migration[] {
  let results: Migration[] = []
  fs.readdirSync(directory).forEach(file => {
    const f = path.join(directory, file)
    const stat = fs.statSync(f)

    if (stat && stat.isDirectory()) {
      results = results.concat(getMigrations(f))
    } else {
      results.push({
        name: path.basename(file, path.extname(file)),
        contents: fs.readFileSync(f, 'utf8')
      })
    }
  })
  return results
}

async function migrateIfNeeded(db: Pool, migrations: Migration[]): Promise<Array<string | false>> {
  migrations.sort((a, b) => {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  })

  const results: Array<string | false> = []
  for (const migration of migrations) {
    let versions: string[] = []
    try {
      const result = await db.query('SELECT version FROM migration')
      versions = result.rows.map(row => row.version)
    } catch {
      console.log('MIGRATION TABLE DOES NOT EXIST')
    }

    const contained = versions.indexOf(migration.name) > -1
    if (!contained) {
      console.log(`RUNNING MIGRATION ${migration.name}`)
      await db.query(migration.contents)
      console.log('UPDATING MIGRATION VERSION')
      const insert = sql`
        INSERT INTO migration (
          version,
          migrated
        )
        VALUES (
          ${migration.name},
          ${new Date().toUTCString()}::timestamp with time zone
        )
        RETURNING version;`
      const result = await db.query(insert)
      console.log(`VERSION: ${result.rows[0].version}`)
      results.push(result.rows[0].version as string)
    } else {
      console.log('MIGRATION ALREADY RUN')
      results.push(false)
    }
  }
  return results
}

export = function(db: Pool) {
  return {
    getMigrations,
    migrateIfNeeded: migrateIfNeeded.bind(null, db)
  }
}
