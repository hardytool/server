import configFactory from './config'
import pg from 'pg'
import { seedData } from './seed-data'

const config = configFactory()

const pool = new pg.Pool({
  ...config.db,
  user:             config.db.user     || undefined,
  password:         config.db.password || undefined,
  database:         config.db.database || undefined,
  port:             Number(config.db.port),
  max:              Number(config.db.max),
  idleTimeoutMillis: Number(config.db.idleTimeoutMillis),
})

seedData(pool)
  .then(() => {
    console.log('Seed complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
