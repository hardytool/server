CREATE TABLE migration (
  version varchar(5) PRIMARY KEY NOT NULL,
  migrated timestamp with time zone NOT NULL
);

CREATE TABLE steam_user (
  steam_id varchar(50) PRIMARY KEY NOT NULL,
  name varchar(32) NOT NULL,
  avatar varchar(300),
  solo_mmr integer NOT NULL,
  party_mmr integer NOT NULL
);

CREATE TABLE season (
  id uuid PRIMARY KEY NOT NULL,
  number integer NOT NULL,
  name varchar(100) NOT NULL
);

CREATE TABLE admin (
  steam_id varchar(50) NOT NULL
);

CREATE TABLE team (
  id uuid PRIMARY KEY NOT NULL,
  season_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  logo varchar(300),
  seed integer NOT NULL
);

CREATE TABLE player (
  id uuid PRIMARY KEY NOT NULL,
  season_id uuid NOT NULL,
  steam_id varchar(50) NOT NULL,
  will_captain boolean NOT NULL,
  captain_approved boolean NOT NULL,
  is_vouched boolean NOT NULL
);

CREATE TABLE team_player (
  team_id uuid NOT NULL,
  player_id uuid NOT NULL,
  is_captain boolean NOT NULL
);
