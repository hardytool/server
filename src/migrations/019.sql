CREATE TABLE role (
  id varchar(50) PRIMARY KEY NOT NULL,
  name varchar(50) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TABLE player_role (
  player_id varchar(50) NOT NULL REFERENCES player (id),
  role_id varchar(50) NOT NULL REFERENCES role (id),
  rank integer NOT NULL,
  CHECK(rank > 0 AND rank <= 5),
  UNIQUE(player_id, role_id)
);
