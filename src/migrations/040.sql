-- Consolidate solo_mmr/party_mmr into single mmr column
ALTER TABLE steam_user ADD COLUMN mmr integer NOT NULL DEFAULT 0 CHECK (mmr >= 0);
UPDATE steam_user SET mmr = GREATEST(solo_mmr, party_mmr);
ALTER TABLE steam_user DROP COLUMN solo_mmr;
ALTER TABLE steam_user DROP COLUMN party_mmr;

-- Rename rank → rank_tier to match GC field name
ALTER TABLE steam_user RENAME COLUMN rank TO rank_tier;

-- Drop stale columns
ALTER TABLE steam_user DROP COLUMN previous_rank;
ALTER TABLE profile DROP COLUMN IF EXISTS adjusted_rank;
