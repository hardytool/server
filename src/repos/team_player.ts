import { sql } from 'pg-sql'
import type { Pool } from 'pg'
import type { UnassignedPlayer, TeamPlayer, PlayerTeam } from '../types/db'

async function getUnassignedPlayers(db: Pool, season_id: number | string, division_id: number | string): Promise<UnassignedPlayer[]> {
  const select = sql`
  SELECT
    player.id,
    steam_user.steam_id,
    steam_user.avatar,
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.mmr,
    steam_user.rank_tier,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE steam_user.mmr
    END AS adjusted_mmr
  FROM
    player
  JOIN steam_user ON
    player.steam_id = steam_user.steam_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  WHERE
    player.id NOT IN (
      SELECT
        team_player.player_id
      FROM
        team_player
    )
  AND
    player.season_id = ${season_id}
  AND
    player.division_id = ${division_id}
  ORDER BY
    steam_user.name ASC,
    steam_user.steam_id ASC
  `
  const result = await db.query(select)
  return result.rows
}

async function getRoster(db: Pool, team_id: number | string): Promise<TeamPlayer[]> {
  const select = sql`
  SELECT
    player.id,
    steam_user.steam_id,
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.avatar,
    steam_user.mmr,
    steam_user.rank_tier,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE steam_user.mmr
    END AS adjusted_mmr,
    team_player.is_captain
  FROM
    team
  JOIN team_player ON
    team.id = team_player.team_id
  JOIN player ON
    team_player.player_id = player.id
  JOIN steam_user ON
    player.steam_id = steam_user.steam_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  WHERE
    team.id = ${team_id}
  ORDER BY
    adjusted_mmr DESC,
    steam_user.mmr DESC,
    steam_user.name ASC
  `
  const result = await db.query(select)
  return result.rows
}

async function getPlayerTeams(db: Pool, steam_id: string, season_id?: number | string, division_id?: number | string): Promise<PlayerTeam[]> {
  let select = sql`
  SELECT
    team.id,
    team.season_id,
    team.division_id,
    team.name,
    team.logo,
    team.seed,
    team_player.is_captain,
    season.name AS season_name,
    season.number AS season_number,
    division.name AS division_name
  FROM
    steam_user
  JOIN player ON
    steam_user.steam_id = player.steam_id
  JOIN team_player ON
    player.id = team_player.player_id
  JOIN team ON
    team_player.team_id = team.id
  JOIN season ON
    season.id = team.season_id
  JOIN division ON
    division.id = team.division_id
  WHERE
    steam_user.steam_id = ${steam_id}
  `
  if (season_id) {
    select = sql.join([select, sql`
    AND
      team.season_id = ${season_id}
    AND
      player.season_id = ${season_id}
    `])
  }
  if (division_id) {
    select = sql.join([select, sql`
    AND
      team.division_id = ${division_id}
    AND
      player.division_id = ${division_id}
    `])
  }
  select = sql.join([select, sql`
  ORDER BY season.number DESC, division.name ASC
  `])
  const result = await db.query(select)
  return result.rows
}

async function addPlayerToTeam(db: Pool, team_id: number | string, player_id: number | string, is_captain: boolean): Promise<unknown> {
  const upsert = sql`
  INSERT INTO team_player (
    team_id,
    player_id,
    is_captain
  ) VALUES (
    ${team_id},
    ${player_id},
    ${is_captain}
  ) ON CONFLICT (
    player_id
  ) DO UPDATE SET (
    team_id,
    is_captain
  ) = (
    ${team_id},
    ${is_captain}
  )
  `
  return db.query(upsert)
}

async function removePlayerFromTeam(db: Pool, team_id: number | string, player_id: number | string): Promise<unknown> {
  const query = sql`
  DELETE FROM
    team_player
  WHERE
    team_id = ${team_id}
  AND
    player_id = ${player_id}
  `
  return db.query(query)
}

async function isCaptainAutoApproved(db: Pool, steam_id: string): Promise<{ allowed: boolean }> {
  const select = sql`
  SELECT
    NOT disbanded AND captained AS allowed
  FROM (
    SELECT
      COUNT(CASE WHEN team.disbanded = true THEN 1 END) > 0 AS disbanded,
      COUNT(1) > 0 AS captained
    FROM
      player
    JOIN team_player ON
      player.id = team_player.player_id
    JOIN team ON
      team_player.team_id = team.id
    JOIN season ON
      team.season_id = season.id
    WHERE
      player.steam_id = ${steam_id}
    AND
      team_player.is_captain = true
  ) can_captain
  `
  const result = await db.query(select)
  return result.rows[0]
}

async function hasPlayed(db: Pool, steam_id: string): Promise<{ has_played: boolean }> {
  const select = sql`
  SELECT
    COUNT(1) > 0 AS has_played
  FROM
    team_player
  JOIN player ON
    team_player.player_id = player.id
  WHERE
    player.steam_id = ${steam_id}
  `
  const result = await db.query(select)
  return result.rows[0]
}

export = function(db: Pool) {
  return {
    getUnassignedPlayers: getUnassignedPlayers.bind(null, db),
    getRoster: getRoster.bind(null, db),
    getPlayerTeams: getPlayerTeams.bind(null, db),
    addPlayerToTeam: addPlayerToTeam.bind(null, db),
    removePlayerFromTeam: removePlayerFromTeam.bind(null, db),
    isCaptainAutoApproved: isCaptainAutoApproved.bind(null, db),
    hasPlayed: hasPlayed.bind(null, db)
  }
}
