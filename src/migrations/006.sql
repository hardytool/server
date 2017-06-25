ALTER TABLE series
  RENAME COLUMN serial TO round;

ALTER TABLE season
  RENAME COLUMN current_serial TO current_round;

