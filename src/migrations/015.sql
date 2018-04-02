CREATE TABLE division (
  id varchar(50) PRIMARY KEY NOT NULL,
  name varchar(100) NOT NULL,
  UNIQUE(name)
);

INSERT INTO division (id, name) VALUES ('_', '');

ALTER TABLE player
  ADD COLUMN division_id varchar(50) NOT NULL REFERENCES division (id) DEFAULT '_';
ALTER TABLE player ALTER COLUMN division_id DROP DEFAULT;

ALTER TABLE team
  ADD COLUMN division_id varchar(50) NOT NULL REFERENCES division (id) DEFAULT '_';
ALTER TABLE team ALTER COLUMN division_id DROP DEFAULT;

ALTER TABLE series
  ADD COLUMN division_id varchar(50) NOT NULL REFERENCES division (id) DEFAULT '_';
ALTER TABLE series ALTER COLUMN division_id DROP DEFAULT;
