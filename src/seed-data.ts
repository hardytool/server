import type { Pool } from 'pg'
import seasonRepo from './repos/season'
import divisionRepo from './repos/division'
import steamUserRepo from './repos/steam_user'
import teamRepo from './repos/team'
import playerRepo from './repos/player'
import teamPlayerRepo from './repos/team_player'

// ---------------------------------------------------------------------------
// Seed constants
// ---------------------------------------------------------------------------

const SEASONS = [
  { id: 1, number: 1, name: 'Season 1', active: false, activity_check: false, registration_open: false },
  { id: 2, number: 2, name: 'Season 2', active: true,  activity_check: false, registration_open: true  },
]

const DIVISIONS = [
  { id: 1, name: 'Division A', active: true, discord_url: '', start_time: 'Sunday 5pm', draft_sheet_url: '' },
  { id: 2, name: 'Division B', active: true, discord_url: '', start_time: 'Sunday 7pm', draft_sheet_url: '' },
]

// 40 fake users — reused across all (season, division) tuples
const STEAM_USERS = Array.from({ length: 40 }, (_, i) => {
  const n = i + 1
  const mmr = 1000 + (i % 8) * 500   // 1000, 1500, 2000, … 4500 cycling
  const rank = Math.min(8, Math.ceil(mmr / 700))
  return {
    steam_id:      `765611980000${String(n).padStart(4, '0')}`,
    name:          `SeedPlayer${String(n).padStart(2, '0')}`,
    avatar:        '',
    solo_mmr:      mmr,
    party_mmr:     mmr - 100,
    rank,
  }
})

// Team names per division index (8 per division). Names must be unique within
// a season because the DB constraint is on (season_id, name), not
// (season_id, division_id, name). Each division gets its own distinct slice.
const TEAM_NAMES_PER_DIVISION = [
  ['Alpha',  'Bravo',    'Charlie', 'Delta',    'Echo',   'Foxtrot', 'Golf',  'Hotel'],
  ['India',  'Juliet',   'Kilo',    'Lima',     'Mike',   'November','Oscar', 'Papa' ],
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Returns the 5 steam users assigned to slot teamIndex (0-based) within a
// (season, division) tuple. Players are drawn round-robin from STEAM_USERS so
// the same user can appear in multiple tuples.
function playersForTeam(teamIndex: number): typeof STEAM_USERS {
  return Array.from({ length: 5 }, (_, slot) => {
    const idx = (teamIndex * 5 + slot) % STEAM_USERS.length
    return STEAM_USERS[idx]
  })
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function seedData(pool: Pool): Promise<void> {
  const season    = seasonRepo(pool)
  const division  = divisionRepo(pool)
  const steamUser = steamUserRepo(pool)
  const team      = teamRepo(pool)
  const player    = playerRepo(pool)
  const teamPlayer = teamPlayerRepo(pool)

  // 1. Seasons
  for (const s of SEASONS) {
    await season.saveSeason(s)
  }
  console.log(`Seeded ${SEASONS.length} seasons`)

  // 2. Divisions
  for (const d of DIVISIONS) {
    await division.saveDivision(d)
  }
  console.log(`Seeded ${DIVISIONS.length} divisions`)

  // 3. Steam users
  for (const u of STEAM_USERS) {
    await steamUser.saveSteamUser(u)
  }
  console.log(`Seeded ${STEAM_USERS.length} steam users`)

  // 4. Teams, players, and team_player rows
  let teamId  = 1
  let playerId = 1

  for (const s of SEASONS) {
    for (let di = 0; di < DIVISIONS.length; di++) {
      const d = DIVISIONS[di]
      const teamNames = TEAM_NAMES_PER_DIVISION[di]
      for (let t = 0; t < teamNames.length; t++) {
        // Team
        await team.saveTeam({
          id:           teamId,
          season_id:    s.id,
          division_id:  d.id,
          name:         teamNames[t],
          logo:         '',
          team_number:  t + 1,
          seed:         t + 1,
          disbanded:    false,
          standin_count: 0,
        })

        const members = playersForTeam(t)

        for (let m = 0; m < members.length; m++) {
          const user      = members[m]
          const isCaptain = m === 0

          // Player registration for this (season, division)
          await player.savePlayer({
            id:               playerId,
            season_id:        s.id,
            division_id:      d.id,
            steam_id:         user.steam_id,
            will_captain:     isCaptain ? 'yes' : 'no',
            captain_approved: isCaptain,
            statement:        '',
            is_draftable:     true,
            activity_check:   false,
            mmr_screenshot:   '',
          })

          // Assign to team
          await teamPlayer.addPlayerToTeam(teamId, playerId, isCaptain)

          playerId++
        }

        teamId++
      }
    }
  }

  const teamCount   = SEASONS.length * DIVISIONS.length * TEAM_NAMES_PER_DIVISION[0].length
  const playerCount = teamCount * 5
  console.log(`Seeded ${teamCount} teams and ${playerCount} player registrations`)
}
