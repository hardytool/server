import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

let container: StartedPostgreSqlContainer
let pool: pg.Pool

export function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 5000 })
    return true
  } catch {
    return false
  }
}

export async function setupDatabase(): Promise<pg.Pool> {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test')
    .start()

  pool = new pg.Pool({
    connectionString: container.getConnectionUri(),
  })

  // Run all migrations in order
  const migrationsDir = path.join(__dirname, '../../src/migrations')
  const files = fs.readdirSync(migrationsDir).sort()
  for (const file of files) {
    if (!file.endsWith('.sql')) continue
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    await pool.query(sql)
    await pool.query(
      'INSERT INTO migration (version, migrated) VALUES ($1, NOW()) ON CONFLICT DO NOTHING',
      [file.replace('.sql', '')]
    )
  }

  return pool
}

export async function teardownDatabase(): Promise<void> {
  await pool?.end()
  await container?.stop()
}

export function getPool(): pg.Pool {
  return pool
}

export async function cleanTables(): Promise<void> {
  // Delete in dependency order (most dependent first)
  await pool.query(`
    DELETE FROM team_player;
    DELETE FROM player_role;
    DELETE FROM series;
    DELETE FROM round;
    DELETE FROM team;
    DELETE FROM player;
    DELETE FROM vouch;
    DELETE FROM ip_address;
    DELETE FROM banned_player;
    DELETE FROM admin;
    DELETE FROM admin_group;
    DELETE FROM profile;
    DELETE FROM steam_user;
    DELETE FROM division;
    DELETE FROM season;
    DELETE FROM role;
  `)
}
