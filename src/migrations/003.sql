ALTER TABLE season
  ADD COLUMN active boolean NOT NULL DEFAULT false;
ALTER TABLE season
  ADD COLUMN current_serial integer NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX ON season (active)
  WHERE active = true;
