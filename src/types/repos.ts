// ---------------------------------------------------------------------------
// Repository interfaces — the contract each repo factory returns.
// These are used by lib/auth.ts (Phase 3) and will be implemented by the
// concrete repo factories in Phase 4.
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
  getAdmins(): Promise<AdminRow[]>
  getDivisionAdmins(division_id: number | string): Promise<DivisionAdminRow[]>
  saveAdmin(admin: Pick<Admin, 'steam_id' | 'group_id'> & { division_id?: number | null }): Promise<unknown>
  deleteAdmin(steam_id: string): Promise<unknown>
}

// ---- Admin group -----------------------------------------------------------

export interface AdminGroupRepo {
  getAdminGroups(): Promise<AdminGroup[]>
  getAdminGroupNames(): Promise<Pick<AdminGroup, 'id' | 'name'>[]>
  saveAdminGroup(group: Partial<AdminGroup>): Promise<unknown>
  deleteAdminGroup(id: number | string): Promise<unknown>
}

// ---- Banned player ---------------------------------------------------------

export interface BannedPlayerRepo {
  getBannedPlayers(): Promise<BannedPlayer[]>
  saveBannedPlayer(player: Partial<BannedPlayer>): Promise<unknown>
  deleteBannedPlayer(id: number | string): Promise<unknown>
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
  saveIPAddress(ip: string, steam_id: string): Promise<unknown>
}

// ---- Migration -------------------------------------------------------------

export interface MigrationRepo {
  getMigrations(directory: string): Migration[]
  migrateIfNeeded(migrations: Migration[]): Promise<Array<string | false>>
}

// ---- Player ----------------------------------------------------------------

export interface PlayerRepo {
  getPlayers(criteria?: PlayerCriteria, sort?: PlayerSort): Promise<PlayerRow[]>
  getPlayer(id: number | string): Promise<PlayerRow | undefined>
  getDraftSheet(criteria?: PlayerCriteria): Promise<DraftSheetRow[]>
  savePlayer(player: Partial<Player> & { steam_id: string; season_id: number }): Promise<unknown>
  deletePlayer(id: number | string): Promise<unknown>
  hasFalseActivity(season_id: number | string): Promise<{ count: string }>
  getCurrentPlayerCount(): Promise<PlayerCountRow[]>
}

// ---- Player role -----------------------------------------------------------

export interface PlayerRoleRepo {
  getRoleRanks(criteria?: { player_id?: number | string }): Promise<PlayerRole[]>
  saveRoleRank(player_id: number | string, role_id: number | string, rank: number): Promise<unknown>
}

// ---- Profile ---------------------------------------------------------------

// Input shape for saveProfile — all profile fields plus required steam_id
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
  getRoles(): Promise<Role[]>
  saveRole(role: Partial<Role>): Promise<unknown>
  deleteRole(id: number | string): Promise<unknown>
}

// ---- Season ----------------------------------------------------------------

export interface SeasonRepo {
  getSeasons(): Promise<Season[]>
  getSeason(id: number | string): Promise<Season>
  saveSeason(season: Partial<Season>): Promise<unknown>
  deleteSeason(id: number | string): Promise<unknown>
  startSeason(divisionIds: string[], seasonId: number | string): Promise<unknown>
}

// ---- Series ----------------------------------------------------------------

export interface SeriesRepo {
  getSeries(criteria?: SeriesCriteria): Promise<SeriesRow[]>
  getSeriesById(id: number | string): Promise<SeriesRow | undefined>
  saveSeries(series: Partial<Series>): Promise<unknown>
  deleteSeries(id: number | string): Promise<unknown>
  getCurrentRound(season_id: number | string, division_id: number | string): Promise<number>
  getStandings(season_id: number | string, division_id: number | string): Promise<Standing[]>
}

// ---- Steam user ------------------------------------------------------------

export interface SteamUserRepo {
  getSteamUser(steam_id: string): Promise<SteamUser | undefined>
  getSteamUsers(): Promise<SteamUser[]>
  getSteamUsersMissingMMR(): Promise<SteamUser[]>
  getNonPlayerSteamUsers(season_id: number | string): Promise<SteamUser[]>
  saveSteamUser(user: SteamUser): Promise<unknown>
}

// ---- Team ------------------------------------------------------------------

export interface TeamRepo {
  getTeams(criteria?: { season_id?: number | string; division_id?: number | string }): Promise<TeamRow[]>
  getAllSeasonTeams(season_id: number | string): Promise<TeamRow[]>
  getTeam(id: number | string): Promise<Team | undefined>
  saveTeam(team: Partial<Team>): Promise<unknown>
  deleteTeam(id: number | string): Promise<unknown>
}

// ---- Team player -----------------------------------------------------------

export interface TeamPlayerRepo {
  getUnassignedPlayers(season_id: number | string, division_id: number | string): Promise<UnassignedPlayer[]>
  getRoster(team_id: number | string): Promise<TeamPlayer[]>
  getPlayerTeams(steam_id: string): Promise<PlayerTeam[]>
  addPlayerToTeam(team_id: number | string, player_id: number | string, is_captain: boolean): Promise<unknown>
  removePlayerFromTeam(team_id: number | string, player_id: number | string): Promise<unknown>
  isCaptainAutoApproved(season_id: number | string, division_id: number | string): Promise<{ allowed: boolean }>
  hasPlayed(steam_id: string, season_id: number | string): Promise<{ has_played: boolean }>
}

// ---- Vouch -----------------------------------------------------------------

export interface VouchRepo {
  isVouched(steam_id: string): Promise<VouchStatus | undefined>
  vouch(voucher_id: string, vouchee_id: string): Promise<unknown>
  unvouch(steam_id: string): Promise<unknown>
}
