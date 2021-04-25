ALTER TABLE masters_team
ADD COLUMN group_number INTEGER DEFAULT 1;

ALTER TABLE masters_team
ADD COLUMN disbanded boolean NOT NULL DEFAULT false;

CREATE TABLE masters_round (
  season_id varchar(50) NOT NULL REFERENCES masters_season (id),
  division_id varchar(50) NOT NULL REFERENCES masters_division (id),
  current_round integer NOT NULL DEFAULT 0,
  UNIQUE(season_id, division_id)
);

INSERT INTO masters_round (
  season_id,
  division_id,
  current_round
)
SELECT
  masters_season.id AS season_id,
  masters_division.id AS division_id,
  0 AS current_round
FROM
  masters_season
CROSS JOIN
  masters_division;


ALTER TABLE masters_series
ADD COLUMN match_1_forfeit_home BOOLEAN;

ALTER TABLE masters_series
ADD COLUMN match_2_forfeit_home BOOLEAN;

ALTER TABLE masters_series
ADD COLUMN division_id varchar(50) NOT NULL REFERENCES masters_division (id);

ALTER TABLE masters_series
DROP COLUMN series_url;

ALTER TABLE masters_series
ADD COLUMN match_1_url varchar(100);

ALTER TABLE masters_series
ADD COLUMN match_2_url varchar(100);
