ALTER TABLE series
  ADD COLUMN playoff_round integer DEFAULT '-1'::integer;

ALTER TABLE series
  ADD COLUMN playoff_match_num integer DEFAULT 0;
