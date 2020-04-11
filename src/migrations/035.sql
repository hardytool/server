CREATE TABLE banned_player (
  id varchar(50) PRIMARY KEY NOT NULL,
  steam_id varchar(50) NOT NULL,
  name varchar(50) NOT NULL,
  reason varchar(100) NOT NULL,
  banned_until varchar(50) NOT NULL,
  still_banned boolean NOT NULL
);