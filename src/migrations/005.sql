ALTER TABLE player DROP CONSTRAINT player_steam_id_key;

CREATE UNIQUE INDEX player_steam_id_season_id_unique ON player (steam_id, season_id);
