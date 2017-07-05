CREATE TABLE profile (
  steam_id varchar(50) NOT NULL REFERENCES steam_user (steam_id),
  name varchar(100) NULL,
  adjusted_mmr integer,
  name_locked boolean NOT NULL DEFAULT false,
  UNIQUE(steam_id)
);
