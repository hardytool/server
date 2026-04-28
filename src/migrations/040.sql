ALTER TABLE series
ADD CONSTRAINT series_home_or_away_required
CHECK (home_team_id IS NOT NULL OR away_team_id IS NOT NULL)
NOT VALID;
