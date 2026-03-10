import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, isDockerAvailable } from './helpers/db'
import { seedData } from '../src/seed-data'

describe.runIf(isDockerAvailable())('seed data', () => {
  beforeAll(async () => {
    await setupDatabase()
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  it('seeds all entities with correct counts', async () => {
    const pool = getPool()
    await seedData(pool)

    const seasons = await pool.query('SELECT count(*) FROM season')
    expect(Number(seasons.rows[0].count)).toBe(2)

    const divisions = await pool.query('SELECT count(*) FROM division')
    expect(Number(divisions.rows[0].count)).toBe(2)

    const steamUsers = await pool.query('SELECT count(*) FROM steam_user')
    expect(Number(steamUsers.rows[0].count)).toBe(40)

    // 2 seasons * 2 divisions * 8 teams = 32 teams
    const teams = await pool.query('SELECT count(*) FROM team')
    expect(Number(teams.rows[0].count)).toBe(32)

    // 32 teams * 5 players = 160 player registrations
    const players = await pool.query('SELECT count(*) FROM player')
    expect(Number(players.rows[0].count)).toBe(160)

    const teamPlayers = await pool.query('SELECT count(*) FROM team_player')
    expect(Number(teamPlayers.rows[0].count)).toBe(160)
  })

  it('is idempotent — running twice produces same counts', async () => {
    const pool = getPool()
    await seedData(pool)

    const seasons = await pool.query('SELECT count(*) FROM season')
    expect(Number(seasons.rows[0].count)).toBe(2)

    const steamUsers = await pool.query('SELECT count(*) FROM steam_user')
    expect(Number(steamUsers.rows[0].count)).toBe(40)
  })
})
