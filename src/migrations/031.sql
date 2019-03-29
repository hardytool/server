UPDATE series
  SET match_2_url='https://dotabuff.com/matches/' || match_2_url
    WHERE match_2_url is not null;

UPDATE series
  SET match_1_url='https://dotabuff.com/matches/' || match_1_url
    WHERE match_1_url is not null;

