import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupDatabase, teardownDatabase, getPool, cleanTables, isDockerAvailable } from '../helpers/db'
import { resetIds, insertSeason, insertDivision, insertSteamUser, insertPlayer, insertTeam, insertTeamPlayer } from '../helpers/fixtures'
import teamPlayerRepo from '../../src/repos/team_player'

describe.runIf(isDockerAvailable())('team_player repo', () => {
  let teamPlayer: ReturnType<typeof teamPlayerRepo>

  beforeAll(async () => {
    const pool = await setupDatabase()
    teamPlayer = teamPlayerRepo(pool)
  }, 60000)

  afterAll(async () => {
    await teardownDatabase()
  })

  beforeEach(async () => {
    await cleanTables()
    resetIds()
  })

  async function setupData() {
    const pool = getPool()
    const s = await insertSeason(pool, { id: 1, number: 1, name: 'S1' })
    const d = await insertDivision(pool, { id: 1, name: 'D1' })
    const u1 = await insertSteamUser(pool, { steam_id: 'p1', name: 'Alice', solo_mmr: 4000, rank: 6 })
    const u2 = await insertSteamUser(pool, { steam_id: 'p2', name: 'Bob', solo_mmr: 3000, rank: 4 })
    const pl1 = await insertPlayer(pool, { id: 100, season_id: s.id, division_id: d.id, steam_id: 'p1' })
    const pl2 = await insertPlayer(pool, { id: 101, season_id: s.id, division_id: d.id, steam_id: 'p2' })
    const t = await insertTeam(pool, { id: 1, season_id: s.id, division_id: d.id, name: 'Team A' })
    return { pool, s, d, u1, u2, pl1, pl2, t }
  }

  describe('addPlayerToTeam + getRoster', () => {
    it('adds players and returns roster', async () => {
      const { pl1, pl2, t } = await setupData()

      await teamPlayer.addPlayerToTeam(t.id, pl1.id, true)
      await teamPlayer.addPlayerToTeam(t.id, pl2.id, false)

      const roster = await teamPlayer.getRoster(t.id)
      expect(roster).toHaveLength(2)
      const captain = roster.find(r => r.is_captain)
      expect(captain).toBeDefined()
    })
  })

  describe('getUnassignedPlayers', () => {
    it('returns only unassigned players', async () => {
      const { s, d, pl1, pl2, t } = await setupData()

      await teamPlayer.addPlayerToTeam(t.id, pl1.id, true)

      const unassigned = await teamPlayer.getUnassignedPlayers(s.id, d.id)
      expect(unassigned).toHaveLength(1)
      expect(unassigned[0].steam_id).toBe('p2')
    })
  })

  describe('removePlayerFromTeam', () => {
    it('removes a player from the team', async () => {
      const { pl1, t } = await setupData()

      await teamPlayer.addPlayerToTeam(t.id, pl1.id, true)
      await teamPlayer.removePlayerFromTeam(t.id, pl1.id)

      const roster = await teamPlayer.getRoster(t.id)
      expect(roster).toHaveLength(0)
    })
  })

  describe('getPlayerTeams', () => {
    it('returns teams a player belongs to', async () => {
      const { pl1, t } = await setupData()

      await teamPlayer.addPlayerToTeam(t.id, pl1.id, true)

      const teams = await teamPlayer.getPlayerTeams('p1')
      expect(teams).toHaveLength(1)
      expect(teams[0].name).toBe('Team A')
    })

    it('returns empty for player not on any team', async () => {
      await setupData()
      const teams = await teamPlayer.getPlayerTeams('p2')
      expect(teams).toEqual([])
    })
  })

  describe('hasPlayed', () => {
    const cases = [
      { name: 'true when player is on a team', onTeam: true, expected: true },
      { name: 'false when player not on any team', onTeam: false, expected: false },
    ]

    it.each(cases)('$name', async ({ onTeam, expected }) => {
      const { pl1, t } = await setupData()

      if (onTeam) {
        await teamPlayer.addPlayerToTeam(t.id, pl1.id, false)
      }

      const result = await teamPlayer.hasPlayed('p1')
      expect(result.has_played).toBe(expected)
    })
  })

  describe('isCaptainAutoApproved', () => {
    it('returns allowed true for captain of non-disbanded team', async () => {
      const { pl1, t } = await setupData()
      await teamPlayer.addPlayerToTeam(t.id, pl1.id, true)

      const result = await teamPlayer.isCaptainAutoApproved('p1')
      expect(result.allowed).toBe(true)
    })

    it('returns allowed false for captain of disbanded team', async () => {
      const { pool, s, d, pl1 } = await setupData()
      const disbandedTeam = await insertTeam(pool, { id: 99, season_id: s.id, division_id: d.id, name: 'Disbanded', disbanded: true })
      await insertTeamPlayer(pool, disbandedTeam.id, pl1.id, true)

      const result = await teamPlayer.isCaptainAutoApproved('p1')
      expect(result.allowed).toBe(false)
    })
  })
})
