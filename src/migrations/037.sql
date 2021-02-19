CREATE TABLE masters_season (
  id varchar(50) PRIMARY KEY NOT NULL,
  number integer NOT NULL,
  active boolean NOT NULL DEFAULT false,
  registration_open boolean NOT NULL DEFAULT false,
  UNIQUE(number),
  CHECK(number > 0)
);

CREATE TABLE masters_division (
  id varchar(50) PRIMARY KEY NOT NULL,
  name varchar(100) NOT NULL,
  UNIQUE(name)
);

CREATE TABLE masters_team (
  id varchar(50) PRIMARY KEY NOT NULL,
  season_id varchar(50) NOT NULL REFERENCES masters_season (id),
  division_id varchar(50) NOT NULL REFERENCES masters_division (id),
  name varchar(100) NOT NULL,
  logo varchar(300),
  scheduler_discord_id varchar(50),
  approved boolean NOT NULL DEFAULT false,
  UNIQUE(season_id, name)
);

CREATE TABLE masters_player (
  id varchar(50) PRIMARY KEY NOT NULL,
  steam_id varchar(50) NOT NULL REFERENCES steam_user (steam_id),
  discord_id varchar(50) NOT NULL,
  mmr_screenshot varchar(300) NOT NULL DEFAULT '',
  UNIQUE(steam_id)
);

CREATE TABLE masters_team_player (
  team_id varchar(50) NOT NULL REFERENCES masters_team (id),
  player_id varchar(50) NOT NULL REFERENCES masters_player (id),
  position int NOT NULL,
  UNIQUE(team_id, player_id)
);

CREATE TABLE masters_series (
  id varchar(50) PRIMARY KEY NOT NULL,
  season_id varchar(50) NOT NULL REFERENCES masters_season (id),
  home_team_id varchar(50) NOT NULL REFERENCES masters_team (id),
  away_team_id varchar(50) REFERENCES masters_team (id),
  home_points integer NOT NULL,
  away_points integer NOT NULL,
  series_url varchar(100),
  round integer NOT NULL,
  CHECK(home_team_id != away_team_id)
);
