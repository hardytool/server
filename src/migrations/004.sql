CREATE UNIQUE INDEX ON team_player (player_id);

ALTER TABLE player
  DROP COLUMN is_vouched;

CREATE TABLE vouch (
  vouched_id varchar(50) NOT NULL REFERENCES steam_user (steam_id),
  voucher_id varchar(50) NOT NULL REFERENCES steam_user (steam_id),
  CHECK(vouched_id != voucher_id)
);

CREATE TYPE yesnomaybe AS enum('yes', 'no', 'maybe');

ALTER TABLE player
  ALTER COLUMN will_captain TYPE yesnomaybe
  USING
    CASE WHEN will_captain = true
      THEN 'yes'::yesnomaybe
      ELSE 'no'::yesnomaybe
    END;
