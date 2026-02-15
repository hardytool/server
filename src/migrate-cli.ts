import path from 'path'
import configFactory from './config'
import pg from 'pg'
import migrationRepo from './repos/migration'

const config = configFactory()

const pool = new pg.Pool({
  ...config.db,
  user:              config.db.user     || undefined,
  password:          config.db.password || undefined,
  database:          config.db.database || undefined,
  port:              Number(config.db.port),
  max:               Number(config.db.max),
  idleTimeoutMillis: Number(config.db.idleTimeoutMillis),
})

const migration = migrationRepo(pool)

migration.migrateIfNeeded(
  migration.getMigrations(path.join(__dirname, 'migrations')))
  .then(versions => {
    console.log(
      `RUN ${versions.filter(v => v !== false).length} MIGRATIONS`)
    process.exit(0)
  })
  .catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
