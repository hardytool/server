ALTER TABLE series
DROP COLUMN division_id;

ALTER TABLE series
DROP CONSTRAINT series_check1;

ALTER TABLE series
DROP CONSTRAINT series_away_points_check;

ALTER TABLE series
DROP CONSTRAINT series_home_points_check;

ALTER TABLE series
ALTER COLUMN home_points DROP NOT NULL;

ALTER TABLE series
ALTER COLUMN away_points DROP NOT NULL;

ALTER TABLE series
ALTER COLUMN home_team_id DROP NOT NULL;

ALTER TABLE series
ALTER COLUMN home_team_id DROP NOT NULL;

ALTER TABLE series
ADD COLUMN match_number INTEGER;

ALTER TABLE series
ADD COLUMN is_playoff BOOLEAN DEFAULT false;

ALTER TABLE series
ADD COLUMN series_url varchar(100);
