ALTER TABLE player_role
  DROP CONSTRAINT player_role_player_id_fkey;

ALTER TABLE player_role
  ADD CONSTRAINT player_role_player_id_fkey
  FOREIGN KEY (player_id)
  REFERENCES player (id)
  ON DELETE CASCADE;
