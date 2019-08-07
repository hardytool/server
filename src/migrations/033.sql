ALTER TABLE series
ADD COLUMN match_timestamp timestamp without time zone;

CREATE VIEW team_captain_name AS
  SELECT
    team_player.team_id,
    steam_user.steam_id as captain_id,
    COALESCE(profile.name, steam_user.name) AS captain_name
  FROM team_player
  INNER JOIN player ON
      team_player.player_id = player.id
  INNER JOIN steam_user ON
    player.steam_id = steam_user.steam_id
  INNER JOIN profile ON
    steam_user.steam_id = profile.steam_id
    WHERE team_player.is_captain IS TRUE;
