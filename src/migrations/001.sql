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
  id varchar(50) PRIMARY KEY NOT NULL,
  number integer NOT NULL,
  name varchar(100) NOT NULL,
  UNIQUE(number)
);

CREATE TABLE admin (
  steam_id varchar(50) PRIMARY KEY NOT NULL
);

CREATE TABLE team (
  id varchar(50) PRIMARY KEY NOT NULL,
  season_id varchar(50) NOT NULL,
  name varchar(100) NOT NULL,
  logo varchar(300),
  seed integer NOT NULL,
  UNIQUE(season_id, name)
);

CREATE TABLE player (
  id varchar(50) PRIMARY KEY NOT NULL,
  season_id varchar(50) NOT NULL,
  steam_id varchar(50) NOT NULL,
  will_captain boolean NOT NULL,
  captain_approved boolean NOT NULL,
  is_vouched boolean NOT NULL,
  UNIQUE(steam_id)
);

CREATE TABLE team_player (
  team_id varchar(50) NOT NULL,
  player_id varchar(50) NOT NULL,
  is_captain boolean NOT NULL,
  UNIQUE(team_id, player_id)
);
