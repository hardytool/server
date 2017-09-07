ALTER TABLE admin
  ADD COLUMN title varchar(100) NOT NULL DEFAULT '';
ALTER TABLE admin
  ADD COLUMN description varchar(300) NOT NULL DEFAULT '';
ALTER TABLE admin
  ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC');

INSERT INTO admin (
  steam_id,
  title,
  description,
  created_at
) VALUES (
  '96421460',
  '🐼🐼🐼🐼🐼🐼🐼🐼🐼🐼',
  'Notorious opinion-haver. Added to the admin team basically just so that the rest of us didn''t have to keep getting spammed with private message notifications.',
  (NOW() AT TIME ZONE 'UTC')
);

UPDATE admin SET
  title = '<s>Benevolent</s> Dictator',
  description = 'The saltiest admin you''ll ever meet, Tree is the notorious authoritarian who operated the USYee discord before staging a mutiny against RD2L.',
  created_at = (NOW() AT TIME ZONE 'UTC') - '4 hours'::INTERVAL
WHERE
  steam_id = '95576973';

UPDATE admin SET
  title = 'Nerd Supreme',
  description = 'Probably one of the worst players in the league. If the website is down, it''s most likely his fault.',
  created_at = (NOW() AT TIME ZONE 'UTC') - '3 hours'::INTERVAL
WHERE
  steam_id = '64908677';

UPDATE admin SET
  title = 'Sentient Banhammer',
  description = 'TX previously ran the RD2L PST-SUN Discord before <s>auctioning it off</s> appointing a new admin and jumping ship. Believes feeding and making space are the same thing.',
  created_at = (NOW() AT TIME ZONE 'UTC') - '2 hours'::INTERVAL
WHERE
  steam_id = '63813048';

UPDATE admin SET
  title = 'Filthy Brood Picker <em>zip</em>',
  description = 'The diversity hire of the admin team, h! got suckered into trying to herd cats and run the draft so Treebeard could stream what he calls "interviews."',
  created_at = (NOW() AT TIME ZONE 'UTC') - '1 hours'::INTERVAL
WHERE
  steam_id = '69243302';
