-- Create missing talent_profiles record for Vic Mignogna (if not exists)
INSERT INTO public.talent_profiles (user_id, name, slug, active)
SELECT 'fc40e83b-d915-471f-9600-65b74ceb5d10', 'Vic Mignogna', 'vic-mignogna', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.talent_profiles 
  WHERE user_id = 'fc40e83b-d915-471f-9600-65b74ceb5d10'
);