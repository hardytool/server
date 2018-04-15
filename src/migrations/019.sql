CREATE TABLE player_roles (
  player_id varchar(50) NOT NULL REFERENCES player (id),
  role varchar(50) NOT NULL,
  UNIQUE(player_id, role)
);