CREATE TABLE profile (
  steam_id varchar(50) NOT NULL REFERENCES steam_user (steam_id),
  name varchar(100) NULL,
  adjusted_mmr integer,
  name_locked boolean NOT NULL DEFAULT false,
  UNIQUE(steam_id)
);

ALTER TABLE player
  ADD COLUMN statement varchar(500) NOT NULL DEFAULT '';

ALTER TABLE season
  ADD COLUMN registration_open boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX ON season (registration_open)
  WHERE registration_open = true;
