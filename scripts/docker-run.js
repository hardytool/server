#!/usr/bin/env node
'use strict'

const { spawnSync } = require('child_process')

const port = process.env.PORT || '80'

const host = process.env.CODESPACES === 'true'
  ? `${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
  : (process.env.HOST || 'localhost')

const result = spawnSync('docker', ['compose', 'up', '--build'], {
  env: {
    ...process.env,
    HOST: host,
    PORT: port,
    POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
  },
  stdio: 'inherit',
  shell: false,
})

if (result.error) {
  console.error('Failed to start docker compose:', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
