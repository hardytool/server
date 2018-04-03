ALTER TABLE division
  ADD COLUMN active boolean NOT NULL DEFAULT false;

DROP INDEX player_steam_id_season_id_unique;

CREATE UNIQUE INDEX player_steam_id_season_id_unique ON player (steam_id, season_id, division_id);
