CREATE TABLE migration (
  version varchar(5) PRIMARY KEY NOT NULL,
  migrated timestamp with time zone NOT NULL
);

CREATE TABLE steam_user (
  steam_id varchar(50) PRIMARY KEY NOT NULL,
  name varchar(32) NOT NULL,
  avatar varchar(300),
  solo_mmr integer NOT NULL,
  party_mmr integer NOT NULL,
  CHECK(solo_mmr >= 0),
  CHECK(party_mmr >= 0)
);

CREATE TABLE season (
  id varchar(50) PRIMARY KEY NOT NULL,
  number integer NOT NULL,
  name varchar(100) NOT NULL,
  UNIQUE(number),
  CHECK(number > 0)
);

CREATE TABLE admin (
  steam_id varchar(50) PRIMARY KEY NOT NULL
);

CREATE TABLE team (
  id varchar(50) PRIMARY KEY NOT NULL,
  season_id varchar(50) NOT NULL REFERENCES season (id),
  name varchar(100) NOT NULL,
  logo varchar(300),
  seed integer NOT NULL,
  UNIQUE(season_id, name),
  CHECK(seed >= 0)
);

CREATE TABLE player (
  id varchar(50) PRIMARY KEY NOT NULL,
  season_id varchar(50) NOT NULL REFERENCES season (id),
  steam_id varchar(50) NOT NULL REFERENCES steam_user (steam_id),
  will_captain boolean NOT NULL,
  captain_approved boolean NOT NULL,
  is_vouched boolean NOT NULL,
  UNIQUE(steam_id)
);

CREATE TABLE team_player (
  team_id varchar(50) NOT NULL REFERENCES team (id),
  player_id varchar(50) NOT NULL REFERENCES player (id),
  is_captain boolean NOT NULL,
  UNIQUE(team_id, player_id)
);

CREATE TABLE series (
  id varchar(50) PRIMARY KEY NOT NULL,
  serial integer NOT NULL,
  season_id varchar(50) NOT NULL REFERENCES season (id),
  home_team_id varchar(50) NOT NULL REFERENCES team (id),
  away_team_id varchar(50) REFERENCES team (id),
  home_points integer NOT NULL,
  away_points integer NOT NULL,
  match_1_id varchar(50),
  match_2_id varchar(50),
  match_1_forfeit_home boolean,
  match_2_forfeit_home boolean,
  CHECK(serial > 0),
  CHECK(home_team_id != away_team_id),
  CHECK(home_points <= 2 AND home_points >= 0),
  CHECK(away_points <= 2 AND away_points >= 0),
  CHECK(home_points + away_points = 2 OR home_points + away_points = 0)
);
