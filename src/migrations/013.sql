ALTER TABLE steam_user
  ADD COLUMN rank integer;

ALTER TABLE profile
  ADD COLUMN adjusted_rank integer;
