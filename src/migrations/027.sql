CREATE TABLE round (
  season_id varchar(50) NOT NULL REFERENCES season (id),
  division_id varchar(50) NOT NULL REFERENCES division (id),
  current_round integer NOT NULL DEFAULT 0,
  UNIQUE(season_id, division_id)
);

INSERT INTO round (
  season_id,
  division_id,
  current_round
)
SELECT
  season.id AS season_id,
  division.id AS division_id,
  season.current_round AS current_round
FROM
  season
CROSS JOIN
  division;

ALTER TABLE season
  DROP COLUMN current_round;
