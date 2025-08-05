-- Also clean up from auth.users (this should complete the deletion)
-- Note: This requires service role permissions in production
DELETE FROM auth.users WHERE id = 'fc70d417-518f-441f-9eb8-55343902f20c';