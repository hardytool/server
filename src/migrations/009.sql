ALTER TABLE vouch
  ADD CONSTRAINT unique_vouched_id UNIQUE (vouched_id);
