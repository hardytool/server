// ---------------------------------------------------------------------------
// Application configuration interfaces
// ---------------------------------------------------------------------------

export interface ServerConfig {
  host: string
  port: number | string
  https_port: number | string
  steam_api_key: string | false
  website_url: string | false
  secret: string | false
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
