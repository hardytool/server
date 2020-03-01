ALTER TABLE series
DROP COLUMN match_timestamp;

ALTER TABLE series
ADD COLUMN home_seed varchar(100);

ALTER TABLE series
ADD COLUMN away_seed varchar(100);
