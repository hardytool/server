import type pg from 'pg'

let idCounter = 1

export function resetIds(): void {
  idCounter = 1
}

function nextId(): number {
  return idCounter++
}

export async function insertSeason(pool: pg.Pool, overrides?: Record<string, unknown>) {
  const id = overrides?.id ?? nextId()
  const defaults = {
    id,
    number: id,
    name: `Season ${id}`,
    active: false,
    activity_check: false,
    registration_open: false,
  }
  const s = { ...defaults, ...overrides }
  await pool.query(
    'INSERT INTO season (id, number, name, active, activity_check, registration_open) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
    [s.id, s.number, s.name, s.active, s.activity_check, s.registration_open]
  )
  return s
}

export async function insertDivision(pool: pg.Pool, overrides?: Record<string, unknown>) {
  const id = overrides?.id ?? nextId()
  const defaults = {
    id,
    name: `Division ${id}`,
    active: true,
    discord_url: '',
    start_time: 'Sunday 5pm',
    draft_sheet_url: '',
  }
  const d = { ...defaults, ...overrides }
  await pool.query(
    'INSERT INTO division (id, name, active, discord_url, start_time, draft_sheet_url) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
    [d.id, d.name, d.active, d.discord_url, d.start_time, d.draft_sheet_url]
  )
  return d
}

export async function insertSteamUser(pool: pg.Pool, overrides?: Record<string, unknown>) {
  const id = overrides?.steam_id ?? `steam_${nextId()}`
  const defaults = {
    steam_id: id,
    name: `Player ${id}`,
    avatar: '',
    solo_mmr: 3000,
    party_mmr: 2500,
  }
  const u = { ...defaults, ...overrides }
  await pool.query(
    'INSERT INTO steam_user (steam_id, name, avatar, solo_mmr, party_mmr) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (steam_id) DO NOTHING',
    [u.steam_id, u.name, u.avatar, u.solo_mmr, u.party_mmr]
  )
  return u
}

export async function insertPlayer(pool: pg.Pool, overrides?: Record<string, unknown>) {
  const id = overrides?.id ?? nextId()
  const defaults = {
    id,
    season_id: undefined as unknown,
    division_id: undefined as unknown,
    steam_id: undefined as unknown,
    will_captain: 'no',
    captain_approved: false,
    statement: '',
    is_draftable: true,
    activity_check: false,
    mmr_screenshot: '',
  }
  const p = { ...defaults, ...overrides }
  await pool.query(
    'INSERT INTO player (id, season_id, division_id, steam_id, will_captain, captain_approved, statement, is_draftable, activity_check, mmr_screenshot) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING',
    [p.id, p.season_id, p.division_id, p.steam_id, p.will_captain, p.captain_approved, p.statement, p.is_draftable, p.activity_check, p.mmr_screenshot]
  )
  return p
}

export async function insertTeam(pool: pg.Pool, overrides?: Record<string, unknown>) {
  const id = overrides?.id ?? nextId()
  const defaults = {
    id,
    season_id: undefined as unknown,
    division_id: undefined as unknown,
    name: `Team ${id}`,
    logo: '',
    team_number: 1,
    seed: 1,
    disbanded: false,
    standin_count: 0,
  }
  const t = { ...defaults, ...overrides }
  await pool.query(
    'INSERT INTO team (id, season_id, division_id, name, logo, team_number, seed, disbanded, standin_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
    [t.id, t.season_id, t.division_id, t.name, t.logo, t.team_number, t.seed, t.disbanded, t.standin_count]
  )
  return t
}

export async function insertTeamPlayer(pool: pg.Pool, teamId: unknown, playerId: unknown, isCaptain = false) {
  await pool.query(
    'INSERT INTO team_player (team_id, player_id, is_captain) VALUES ($1, $2, $3) ON CONFLICT (player_id) DO NOTHING',
    [teamId, playerId, isCaptain]
  )
}

export async function insertRole(pool: pg.Pool, overrides?: Record<string, unknown>) {
  const id = overrides?.id ?? nextId()
  const defaults = { id, name: `Role ${id}` }
  const r = { ...defaults, ...overrides }
  await pool.query(
    'INSERT INTO role (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
    [r.id, r.name]
  )
  return r
}

export async function insertProfile(pool: pg.Pool, steamId: string, overrides?: Record<string, unknown>) {
  const defaults = {
    steam_id: steamId,
    name: null,
    faceit_name: null,
    discord_name: null,
    adjusted_mmr: null,
    name_locked: false,
    theme: 'default',
  }
  const p = { ...defaults, ...overrides }
  await pool.query(
    'INSERT INTO profile (steam_id, name, faceit_name, discord_name, adjusted_mmr, name_locked, theme) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (steam_id) DO UPDATE SET name = $2, faceit_name = $3, discord_name = $4, adjusted_mmr = $5, name_locked = $6, theme = $7',
    [p.steam_id, p.name, p.faceit_name, p.discord_name, p.adjusted_mmr, p.name_locked, p.theme]
  )
  return p
}

export async function insertAdminGroup(pool: pg.Pool, overrides?: Record<string, unknown>) {
  const id = overrides?.id ?? nextId()
  const defaults = { id, name: `Group ${id}` }
  const g = { ...defaults, ...overrides }
  await pool.query(
    'INSERT INTO admin_group (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
    [g.id, g.name]
  )
  return g
}

export async function insertAdmin(pool: pg.Pool, steamId: string, groupId: unknown, divisionId?: unknown) {
  await pool.query(
    'INSERT INTO admin (steam_id, group_id, division_id) VALUES ($1, $2, $3) ON CONFLICT (steam_id) DO NOTHING',
    [steamId, groupId, divisionId ?? null]
  )
}
