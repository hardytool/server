// ---------------------------------------------------------------------------
// Repository interfaces — the contract each repo factory returns.
// Signatures are derived directly from the source implementations.
// ---------------------------------------------------------------------------
import type {
  Admin,
  AdminRow,
  AdminGroup,
  ActivityCheck,
  BannedPlayer,
  Division,
  DivisionAdminRow,
  IpAddress,
  Migration,
  Player,
  PlayerCountRow,
  PlayerCriteria,
  PlayerRole,
  PlayerRow,
  PlayerSort,
  PlayerTeam,
  DraftSheetRow,
  Profile,
  Role,
  Season,
  Series,
  SeriesCriteria,
  SeriesRow,
  Standing,
  SteamUser,
  Team,
  TeamPlayer,
  TeamRow,
  UnassignedPlayer,
  VouchStatus,
} from './db'

// ---- Admin -----------------------------------------------------------------

export interface AdminRepo {
  isAdmin(steam_id: string): Promise<boolean>
  getAdmins(criteria?: { steam_id?: string }): Promise<AdminRow[]>
  getDivisionAdmins(division_id: number | string): Promise<DivisionAdminRow[]>
  saveAdmin(admin: Pick<Admin, 'steam_id' | 'group_id'> & { division_id?: number | null }): Promise<unknown>
  deleteAdmin(steam_id: string): Promise<unknown>
}

// ---- Admin group -----------------------------------------------------------

export interface AdminGroupRepo {
  getAdminGroups(criteria?: { admin_group_id?: number | string }): Promise<AdminGroup[]>
  getAdminGroupNames(): Promise<Pick<AdminGroup, 'id' | 'name'>[]>
  saveAdminGroup(group: Partial<AdminGroup>): Promise<unknown>
  deleteAdminGroup(admin_group_id: number | string): Promise<unknown>
}

// ---- Banned player ---------------------------------------------------------

export interface BannedPlayerRepo {
  getBannedPlayers(criteria?: { banned_player_id?: number | string }): Promise<BannedPlayer[]>
  saveBannedPlayer(player: Partial<BannedPlayer>): Promise<unknown>
  deleteBannedPlayer(banned_player_id: number | string): Promise<unknown>
}

// ---- Division --------------------------------------------------------------

export interface DivisionRepo {
  getDivisions(criteria?: { active?: boolean }): Promise<Division[]>
  getDivision(id: number | string): Promise<Division>
  saveDivision(division: Partial<Division>): Promise<unknown>
  deleteDivision(id: number | string): Promise<unknown>
}

// ---- IP address ------------------------------------------------------------

export interface IpAddressRepo {
  getIPAddresses(): Promise<IpAddress[]>
  saveIPAddress(ip: string, steamId: string): Promise<unknown>
}

// ---- Migration -------------------------------------------------------------

export interface MigrationRepo {
  getMigrations(directory: string): Migration[]
  migrateIfNeeded(migrations: Migration[]): Promise<Array<string | false>>
}

// ---- Player ----------------------------------------------------------------

// Extended criteria accepted by player.getPlayers (beyond the base type)
export interface FullPlayerCriteria extends PlayerCriteria {
  will_captain?: boolean
  captain_approved?: boolean
  is_captain?: boolean
  is_standin?: boolean
  hide_captains?: boolean
  hide_standins?: boolean
}

export interface PlayerRepo {
  getPlayers(criteria?: FullPlayerCriteria, sort?: PlayerSort): Promise<PlayerRow[]>
  getPlayer(id: number | string): Promise<PlayerRow | undefined>
  getDraftSheet(criteria?: FullPlayerCriteria, sort?: PlayerSort): Promise<DraftSheetRow[]>
  savePlayer(player: Partial<Player> & { steam_id: string; season_id: number }): Promise<unknown>
  deletePlayer(id: number | string): Promise<unknown>
  unregisterPlayer(seasonId: number | string, divisionId: number | string, steamId: string): Promise<unknown>
  activityCheck(season_id: number | string, steam_id: string): Promise<unknown>
  hasFalseActivity(season_id: number | string, steam_id: string): Promise<{ count: string }>
  getCurrentPlayerCount(season_id: number | string): Promise<PlayerCountRow[]>
}

// ---- Player role -----------------------------------------------------------

export interface PlayerRoleRepo {
  getRoleRanks(criteria?: { player_id?: number | string }): Promise<PlayerRole[]>
  saveRoleRank(player_id: number | string, role_id: number | string, rank: number): Promise<unknown>
}

// ---- Profile ---------------------------------------------------------------

export interface ProfileInput {
  steam_id: string
  name?: string | null
  faceit_name: string | null
  discord_name: string | null
  adjusted_mmr: number | null
  name_locked: boolean
  theme: string
}

export interface ProfileRepo {
  getProfile(steam_id: string): Promise<Profile | undefined>
  saveProfile(profile: ProfileInput): Promise<unknown>
  getActivityCheck(steam_id: string): Promise<ActivityCheck | undefined>
}

// ---- Role ------------------------------------------------------------------

export interface RoleRepo {
  getRoles(criteria?: { role_id?: number | string }): Promise<Role[]>
  saveRole(role: Partial<Role>): Promise<unknown>
  deleteRole(role_id: number | string): Promise<unknown>
}

// ---- Season ----------------------------------------------------------------

export interface SeasonRepo {
  getSeasons(): Promise<Season[]>
  getSeason(id: number | string): Promise<Season>
  getActiveSeason(): Promise<Season | undefined>
  saveSeason(season: Partial<Season>): Promise<unknown>
  deleteSeason(id: number | string): Promise<unknown>
  startSeason(divisionIds: string[], seasonId: number | string): Promise<unknown>
}

// ---- Series ----------------------------------------------------------------

export interface SeriesRepo {
  getSeries(criteria: SeriesCriteria & { series_id?: number | string; team_id?: number | string }): Promise<SeriesRow[]>
  saveSeries(series: Partial<Series>): Promise<unknown>
  deleteSeries(id: number | string): Promise<unknown>
  getCurrentRound(season_id: number | string, division_id: number | string, round?: number | string): Promise<number>
  saveCurrentRound(season_id: number | string, division_id: number | string, round: number | string): Promise<unknown>
  getStandings(season_id: number | string, division_id: number | string, round?: number | string): Promise<Standing[]>
}

// ---- Steam user ------------------------------------------------------------

export interface SteamUserRepo {
  getSteamUser(steam_id: string): Promise<SteamUser | undefined>
  getSteamUsers(): Promise<SteamUser[]>
  getSteamUsersMissingMMR(season_id: number | string): Promise<SteamUser[]>
  getNonPlayerSteamUsers(season_id: number | string, division_id: number | string): Promise<SteamUser[]>
  saveSteamUser(user: SteamUser): Promise<unknown>
  deleteSteamUser(steam_id: string): Promise<unknown>
}

// ---- Team ------------------------------------------------------------------

export interface TeamRepo {
  getTeams(season_id: number | string, division_id?: number | string): Promise<TeamRow[]>
  getAllSeasonTeams(season_id: number | string): Promise<TeamRow[]>
  getTeam(id: number | string): Promise<Team | undefined>
  saveTeam(team: Partial<Team>): Promise<unknown>
  deleteTeam(id: number | string): Promise<unknown>
}

// ---- Team player -----------------------------------------------------------

export interface TeamPlayerRepo {
  getUnassignedPlayers(season_id: number | string, division_id: number | string): Promise<UnassignedPlayer[]>
  getRoster(team_id: number | string): Promise<TeamPlayer[]>
  getPlayerTeams(steam_id: string, season_id?: number | string, division_id?: number | string): Promise<PlayerTeam[]>
  addPlayerToTeam(team_id: number | string, player_id: number | string, is_captain: boolean): Promise<unknown>
  removePlayerFromTeam(team_id: number | string, player_id: number | string): Promise<unknown>
  isCaptainAutoApproved(steam_id: string): Promise<{ allowed: boolean }>
  hasPlayed(steam_id: string): Promise<{ has_played: boolean }>
}

// ---- Vouch -----------------------------------------------------------------

export interface VouchRepo {
  isVouched(steam_id: string): Promise<VouchStatus | undefined>
  vouch(voucher_id: string, vouchee_id: string): Promise<unknown>
  unvouch(steam_id: string): Promise<unknown>
}
