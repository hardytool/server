// ---------------------------------------------------------------------------
// Database entity interfaces — shapes returned by the repos layer
// ---------------------------------------------------------------------------

// ---- Season ----------------------------------------------------------------

export interface Season {
  id: number
  number: number
  name: string
  active: boolean
  activity_check: boolean
  registration_open: boolean
}

// ---- Division --------------------------------------------------------------

export interface Division {
  id: number
  name: string
  active: boolean
  discord_url: string
  start_time: string
  draft_sheet_url: string
}

// ---- Role ------------------------------------------------------------------

export interface Role {
  id: number
  name: string
}

export interface PlayerRole {
  player_id: number
  role_id: number
  rank: number
}

// ---- Steam user ------------------------------------------------------------

export interface SteamUser {
  steam_id: string
  name: string
  avatar: string
  solo_mmr: number
  party_mmr: number
  rank: number
  previous_rank: number
}

// ---- Profile ---------------------------------------------------------------

// getProfile returns COALESCE(profile.name, steam_user.name) as name,
// so all SteamUser fields are present plus profile-specific ones.
export interface Profile extends SteamUser {
  steam_name: string              // raw steam_user.name (before custom override)
  faceit_name: string | null
  discord_name: string | null
  theme: string
  adjusted_mmr: number
  draft_mmr: number
  name_locked: boolean
  is_admin: boolean
}

export interface ActivityCheck {
  steam_id: string
  activity_check: boolean
}

// ---- Player ----------------------------------------------------------------

export interface Player {
  id: number
  season_id: number
  division_id: number
  steam_id: string
  will_captain: 'yes' | 'maybe' | 'no'
  captain_approved: boolean
  statement: string
  is_draftable: boolean
  activity_check: boolean
  mmr_screenshot: string
}

export interface PlayerRow extends Player {
  season_number: number
  season_name: string
  division_name: string
  name: string
  avatar: string
  adjusted_mmr: number
  solo_mmr: number
  party_mmr: number
  rank: number
  previous_rank: number
  discord_name: string | null
  has_played?: boolean
  is_vouched?: boolean
}

export interface DraftSheetRow extends PlayerRow {
  draft_mmr: number
  join_timestamp: string
  dotabuff: string
  opendota: string
}

export interface PlayerCountRow {
  name: string    // division name
  count: string   // pg returns numeric aggregates as strings
}

// Criteria accepted by player.getPlayers / player.getDraftSheet
export interface PlayerCriteria {
  season_id?: number | string
  division_id?: number | string
  is_captain?: boolean
  steam_id?: string
}

// Sort options for player.getPlayers
export interface PlayerSort {
  by_mmr?: boolean
  by_name?: boolean
  by_reverse_mmr?: boolean
}

// ---- Team ------------------------------------------------------------------

export interface Team {
  id: number
  season_id: number
  division_id: number
  name: string
  logo: string
  team_number: number
  seed: number
  disbanded: boolean
  standin_count: number
}

export interface TeamRow extends Team {
  captain_id: string
  captain_name: string
  season_number: number
  season_name: string
  division_name: string
}

// ---- Team player -----------------------------------------------------------

export interface TeamPlayer {
  id: number
  steam_id: string
  name: string
  avatar: string
  solo_mmr: number
  party_mmr: number
  rank: number
  previous_rank: number
  adjusted_mmr: number
  is_captain: boolean
}

export interface PlayerTeam {
  id: number
  season_id: number
  division_id: number
  name: string
  logo: string
  seed: number
  is_captain: boolean
  season_name: string
  season_number: number
  division_name: string
}

export interface UnassignedPlayer {
  id: number
  steam_id: string
  avatar: string
  name: string
  solo_mmr: number
  party_mmr: number
  rank: number
  previous_rank: number
  adjusted_mmr: number
}

// ---- Series ----------------------------------------------------------------

export interface Series {
  id: number
  round: number
  season_id: number
  home_team_id: number
  away_team_id: number
  home_points: number
  away_points: number
  match_1_url: string
  match_2_url: string
  match_1_forfeit_home: boolean
  match_2_forfeit_home: boolean
  match_number: number
  is_playoff: boolean
  series_url: string
  home_seed: number
  away_seed: number
}

export interface SeriesRow extends Series {
  home_team_name: string
  away_team_name: string
  home_team_logo: string
  away_team_logo: string
  home_team_division_id: number
  away_team_division_id: number
  home_team_captain_name: string
  away_team_captain_name: string
}

export interface Standing {
  id: number
  name: string
  logo: string
  seed: number
  disbanded: boolean
  captain_id: string
  captain_name: string
  wins: number
  losses: number
}

// Criteria accepted by series.getSeries
export interface SeriesCriteria {
  season_id?: number | string
  division_id?: number | string
  round?: number | string
  is_playoff?: boolean
}

// ---- Admin -----------------------------------------------------------------

export interface Admin {
  steam_id: string
  // group_id can be the sentinel value '_' when creating the very first admin
  group_id: number | string
  division_id: number | null
}

// getAdmins returns the full joined row with group/division names
export interface AdminRow extends Admin {
  avatar: string
  name: string
  division_name: string
  admin_group_name: string
}

// getDivisionAdmins returns a narrower shape (no cross-table names)
export interface DivisionAdminRow {
  steam_id: string
  avatar: string
  name: string
  group_id: number | string
  division_id: number | null
}

export interface AdminGroup {
  id: number
  name: string
  owner_id: string | null
}

// ---- Banned player ---------------------------------------------------------

export interface BannedPlayer {
  id: number
  steam_id: string
  name: string
  reason: string
  banned_until: string | null   // null means permanently banned
  still_banned: boolean
}

// ---- IP address ------------------------------------------------------------

export interface IpAddress {
  steam_id: string
  ip: string
  avatar: string
  steam_name: string
  discord_name: string | null
  name: string
}

// ---- Vouch -----------------------------------------------------------------

export interface VouchStatus {
  is_vouched: boolean
  voucher_id: string | null
}

// ---- Migration -------------------------------------------------------------

// Filesystem-loaded migration file (not a DB row)
export interface Migration {
  name: string
  contents: string
}

// DB row returned after a migration is applied
export interface MigrationVersion {
  version: string
}
