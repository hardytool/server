// ---------------------------------------------------------------------------
// Application configuration interfaces
// ---------------------------------------------------------------------------

export interface ServerConfig {
  host: string
  port: number | string
  https_port: number | string
  steam_api_key: string
  website_url: string | false
  secret: string
  steam_bot_username: string | false
  steam_bot_password: string | false
}

export interface DbConfig {
  user: string | false
  password: string | false
  database: string | false
  host: string
  port: number | string
  ssl: boolean
  max: number | string
  idleTimeoutMillis: number | string
}

export interface TemplatesConfig {
  title: string
  [key: string]: unknown
}

export interface Config {
  server: ServerConfig
  db: DbConfig
  templates: TemplatesConfig
}
