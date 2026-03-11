ALTER TABLE steam_user
  DROP COLUMN IF EXISTS rank;

ALTER TABLE steam_user
  DROP COLUMN IF EXISTS previous_rank;

ALTER TABLE profile
  DROP COLUMN IF EXISTS adjusted_rank;
