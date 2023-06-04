function config(env) {
  return {
    server: {
      host: env.HOST || 'localhost',
      port: env.PORT || 80,
      https_port: env.HTTPS_PORT || 443,
      ssl_key: env.SSL_KEY || false,
      ssl_cert: env.SSL_CERT || false,
      ssl_ca: env.SSL_CA || false,
      steam_api_key: env.STEAM_API_KEY || false,
      website_url: (!env.WEBSITE_URL) ? false : ('//' + env.WEBSITE_URL),
      secret: env.SECRET || false
    },
    db: {
      user: env.POSTGRES_USER || env.PGUSER || false,
      password: env.POSTGRES_PASSWORD || env.PGPASSWORD || false,
      database: env.POSTGRES_DB || env.PGDATABASE || false,
      host: env.POSTGRES_HOST || 'db',
      port: env.POSTGRES_PORT || 5432,
      // maximum number of clients in client pool
      max: env.POSTGRES_POOL_MAX || 10,
      // duration that clients are kept open while idle
      idleTimeoutMillis: env.POSTGRES_TIMEOUT || 30000
    },
    redis: {
      host: env.REDIS_HOST || 'redis',
      port: env.REDIS_PORT || 6379,
      user: env.REDIS_USER || null,
      password: env.REDIS_PASSWORD || null
    },
    steam: {
      username: env.STEAM_BOT_USERNAME || false,
      password: env.STEAM_BOT_PASSWORD || false
    },
    templates: {
      title: 'RD2L'
    }
  }
}

module.exports = config
