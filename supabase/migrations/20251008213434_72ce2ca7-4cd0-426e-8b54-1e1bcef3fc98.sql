
-- Create talent profile for Maddie Mason
INSERT INTO talent_profiles (
  user_id,
  name,
  slug,
  active,
  public_visibility,
  sort_rank
) VALUES (
  '18c88f76-8a37-4fa2-a7f9-c19f1d224138',
  'Maddie Mason',
  'maddie-mason',
  true,
  false,
  (SELECT COALESCE(MAX(sort_rank), 0) + 1 FROM talent_profiles)
);
