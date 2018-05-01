ALTER TABLE player
  ADD COLUMN ip_address varchar(50) NOT NULL DEFAULT '_';

CREATE TABLE blocked_ip (
  id varchar(50) PRIMARY KEY NOT NULL,
  address varchar(50) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);