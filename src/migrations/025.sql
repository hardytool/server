ALTER TABLE season
  ADD COLUMN activity_check boolean NOT NULL DEFAULT false;

ALTER TABLE player
  ADD COLUMN activity_check boolean NOT NULL DEFAULT false;