/* eslint-disable no-process-env */
import type { Config } from './types/config'

function config(): Config {
  return {
    server: {
      host: process.env.HOST || 'localhost',
      port: process.env.PORT || 80,
      https_port: process.env.HTTPS_PORT || 443,
      steam_api_key: process.env.STEAM_API_KEY || false,
      website_url: (!process.env.WEBSITE_URL) ? false : ('//' + process.env.WEBSITE_URL),
      secret: process.env.SECRET || false,
    },
    db: {
      user: process.env.POSTGRES_USER || process.env.PGUSER || false,
      password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || false,
      database: process.env.POSTGRES_DB || process.env.PGDATABASE || false,
      host: process.env.POSTGRES_HOST || 'db',
      port: process.env.POSTGRES_PORT || 5432,
      ssl: (!process.env.POSTGRES_SSL) ? false : true,
      max: process.env.POSTGRES_POOL_MAX || 10,
      idleTimeoutMillis: process.env.POSTGRES_TIMEOUT || 30000
    },
    templates: {
      title: 'RD2L'
    }
  }
}

export = config
