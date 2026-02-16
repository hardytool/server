/* eslint-disable no-process-env */
import type { Config } from './types/config'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function config(): Config {
  return {
    server: {
      host: process.env.HOST || 'localhost',
      port: process.env.PORT || 80,
      https_port: process.env.HTTPS_PORT || 443,
      steam_api_key: requireEnv('STEAM_API_KEY'),
      website_url: (!process.env.WEBSITE_URL) ? false : ('//' + process.env.WEBSITE_URL),
      secret: requireEnv('SECRET'),
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
