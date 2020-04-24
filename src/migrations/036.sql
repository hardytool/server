CREATE TABLE ip_address (
  ip inet NOT NULL,
  steam_id varchar(50) NOT NULL REFERENCES steam_user (steam_id),
  UNIQUE(steam_id, ip)
);
