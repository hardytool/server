function config(env) {
  return {
    host: env.HOST || 'localhost',
    port: env.PORT || 80,
    https_port: env.HTTPS_PORT || 433,
    ssl_key: env.SSL_KEY || './server.key',
    ssL_crt: env.SSL_CRT || './server.crt',
    steam_api_key: env.STEAM_API_KEY || false
  }
}

module.exports = config
