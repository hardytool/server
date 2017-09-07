var sql = require('pg-sql').sql

function getPlayers(db, criteria, sort) {
  var select = sql`
  SELECT
    player.id,
    player.season_id,
    player.steam_id,
    player.will_captain,
    player.captain_approved,
    player.statement,
    player.is_draftable,
    season.number season_number,
    season.name season_name,
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE GREATEST(steam_user.solo_mmr, steam_user.party_mmr)
    END AS adjusted_mmr,
    has_played.has_played,
    is_vouched.is_vouched
  FROM
    player
  JOIN steam_user ON
    steam_user.steam_id = player.steam_id
  JOIN season ON
    season.id = player.season_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  JOIN (
    SELECT
      player.steam_id,
      SUM(CASE WHEN team_player.player_id IS NULL THEN 0 ELSE 1 END) > 0
        AS has_played
    FROM
      player
    LEFT JOIN team_player ON
      player.id = team_player.player_id
    GROUP BY
      player.steam_id
  ) has_played ON
    player.steam_id = has_played.steam_id
  LEFT JOIN (
    SELECT
      player.steam_id,
      SUM(CASE WHEN vouch.vouched_id IS NULL THEN 0 ELSE 1 END) > 0
        AS is_vouched
    FROM
      player
    LEFT JOIN vouch ON
      player.steam_id = vouch.vouched_id
    GROUP BY
      player.steam_id
  ) is_vouched ON
    player.steam_id = is_vouched.steam_id
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.season_id) {
      select = sql.join([select, sql`
      AND
        player.season_id = ${criteria.season_id}
      `])
    }
    if (criteria.will_captain !== undefined) {
      if (criteria.will_captain) {
        select = sql.join([select, sql`
        AND (
          player.will_captain = 'yes'
          OR
          player.will_captain = 'maybe'
        )
        `])
      } else {
        select = sql.join([select, sql`
        AND
          player.will_captain = 'no'
        `])
      }
    }
    if (criteria.captain_approved !== undefined) {
      select = sql.join([select, sql`
      AND
        player.captain_approved = ${criteria.captain_approved}
      `])
    }
    if (criteria.is_captain !== undefined) {
      if (criteria.is_captain) {
        select = sql.join([select, sql`
        AND (
          player.captain_approved = true
          AND
            player.will_captain = 'yes'
          AND (
            is_vouched.is_vouched = true
            OR
            has_played.has_played = true
          )
          AND
            player.is_draftable
        )
        `])
      } else {
        if (criteria.hide_captains) {
          select = sql.join([select, sql`
          AND (
            player.captain_approved = false
            OR (
              player.will_captain = 'no'
              OR
                player.will_captain = 'maybe'
            )
            OR (
              is_vouched.is_vouched = false
              AND
                has_played.has_played = false
            )
            OR
              NOT player.is_draftable
          )
          `])
        }
      }
    }
    if (criteria.steam_id) {
      select = sql.join([select, sql`
      AND
        player.steam_id = ${criteria.steam_id}
      `])
    }
  }
  if (sort) {
    if (sort.by_mmr) {
      select = sql.join([select, sql`
      ORDER BY
        adjusted_mmr DESC,
        solo_mmr DESC,
        party_mmr DESC,
        name ASC
      `])
    } else if (sort.by_name) {
      select = sql.join([select, sql`
      ORDER BY
        name ASC,
        steam_id ASC
      `])
    }
  } else {
    select = sql.join([select, sql`
    ORDER BY
      created_at ASC
    `])
  }
  return db.query(select).then(result => {
    return result.rows
  })
}

function getPlayer(db, id) {
  var select = sql`
  SELECT
    player.id,
    player.season_id,
    player.steam_id,
    player.will_captain,
    player.captain_approved,
    player.statement,
    player.is_draftable,
    season.number season_number,
    season.name season_name,
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.avatar,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE GREATEST(steam_user.solo_mmr, steam_user.party_mmr)
    END AS adjusted_mmr
  FROM
    player
  JOIN steam_user ON
    steam_user.steam_id = player.steam_id
  JOIN season ON
    season.id = player.season_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  WHERE
    player.id = ${id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function savePlayer(db, player) {
  var upsert = sql`
  INSERT INTO
    player (
      id,
      season_id,
      steam_id,
      will_captain,
      captain_approved,
      statement,
      is_draftable
    ) VALUES (
      ${player.id},
      ${player.season_id},
      ${player.steam_id},
      ${player.will_captain},
      ${player.captain_approved},
      ${player.statement},
      ${player.is_draftable}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      season_id,
      will_captain,
      captain_approved,
      statement,
      is_draftable
    ) = (
      ${player.season_id},
      ${player.will_captain},
      ${player.captain_approved},
      ${player.statement},
      ${player.is_draftable}
    )
  `
  return db.query(upsert)
}

function deletePlayer(db, id) {
  var query = sql`
  DELETE FROM
    player
  WHERE
    id = ${id}
  `
  return db.query(query)
}

function unregisterPlayer(db, seasonId, steamId) {
  var query = sql`
  DELETE FROM
    player
  WHERE
    steam_id = ${steamId}
  AND
    season_id = ${seasonId}
  `
  return db.query(query)
}

function getDraftSheet(db, criteria) {
  var select = sql`
  SELECT
    COALESCE(profile.name, steam_user.name) AS name,
    steam_user.solo_mmr,
    steam_user.party_mmr,
    COALESCE(profile.adjusted_mmr, 0) AS adjusted_mmr,
    CASE
      WHEN profile.adjusted_mmr IS NOT NULL AND profile.adjusted_mmr > 0
      THEN profile.adjusted_mmr
      ELSE GREATEST(steam_user.solo_mmr, steam_user.party_mmr)
    END AS draft_mmr,
    player.statement,
    has_played.has_played OR is_vouched.is_vouched AS is_vouched,
    CONCAT('https://www.dotabuff.com/players/', steam_user.steam_id)
      AS dotabuff,
    CONCAT('https://www.opendota.com/players/', steam_user.steam_id)
      AS opendota
  FROM
    player
  JOIN steam_user ON
    steam_user.steam_id = player.steam_id
  JOIN season ON
    season.id = player.season_id
  LEFT JOIN profile ON
    steam_user.steam_id = profile.steam_id
  JOIN (
    SELECT
      player.steam_id,
      SUM(CASE WHEN team_player.player_id IS NULL THEN 0 ELSE 1 END) > 0
        AS has_played
    FROM
      player
    LEFT JOIN team_player ON
      player.id = team_player.player_id
    GROUP BY
      player.steam_id
  ) has_played ON
    player.steam_id = has_played.steam_id
  LEFT JOIN (
    SELECT
      player.steam_id,
      SUM(CASE WHEN vouch.vouched_id IS NULL THEN 0 ELSE 1 END) > 0
        AS is_vouched
    FROM
      player
    LEFT JOIN vouch ON
      player.steam_id = vouch.vouched_id
    GROUP BY
      player.steam_id
  ) is_vouched ON
    player.steam_id = is_vouched.steam_id
  WHERE
    player.is_draftable
  `
  if (criteria) {
    if (criteria.season_id) {
      select = sql.join([select, sql`
      AND
        player.season_id = ${criteria.season_id}
      `])
    }
    if (criteria.is_captain !== undefined) {
      if (criteria.is_captain) {
        select = sql.join([select, sql`
        AND (
          player.captain_approved = true
          AND
            player.will_captain = 'yes'
          AND (
            is_vouched.is_vouched = true
            OR
              has_played.has_played = true
          )
        )
        `])
      } else {
        if (criteria.hide_captains) {
          select = sql.join([select, sql`
          AND (
            player.captain_approved = false
            OR (
              player.will_captain = 'no'
              OR
                player.will_captain = 'maybe'
            )
            OR (
              is_vouched.is_vouched = false
              AND
                has_played.has_played = false
            )
          )
          `])
        }
      }
    }
  }
  select = sql.join([select, sql`
  ORDER BY
    created_at ASC
  `])
  return db.query(select).then(result => {
    return result.rows
  })
}

module.exports = db => {
  return {
    getPlayers: getPlayers.bind(null, db),
    getPlayer: getPlayer.bind(null, db),
    savePlayer: savePlayer.bind(null, db),
    deletePlayer: deletePlayer.bind(null, db),
    unregisterPlayer: unregisterPlayer.bind(null, db),
    getDraftSheet: getDraftSheet.bind(null, db)
  }
}
