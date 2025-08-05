-- Manually clean up the remaining user that wasn't properly deleted
-- Delete Vic Mignogna user completely
DELETE FROM public.message_reactions WHERE user_id = 'fc70d417-518f-441f-9eb8-55343902f20c';
DELETE FROM public.user_activity_logs WHERE user_id = 'fc70d417-518f-441f-9eb8-55343902f20c' OR admin_user_id = 'fc70d417-518f-441f-9eb8-55343902f20c';
DELETE FROM public.user_login_history WHERE user_id = 'fc70d417-518f-441f-9eb8-55343902f20c';
DELETE FROM public.user_roles WHERE user_id = 'fc70d417-518f-441f-9eb8-55343902f20c';
DELETE FROM public.notification_preferences WHERE user_id = 'fc70d417-518f-441f-9eb8-55343902f20c';
DELETE FROM public.talent_profiles WHERE user_id = 'fc70d417-518f-441f-9eb8-55343902f20c';
DELETE FROM public.messages WHERE sender_id = 'fc70d417-518f-441f-9eb8-55343902f20c' OR recipient_id = 'fc70d417-518f-441f-9eb8-55343902f20c';
DELETE FROM storage.objects WHERE owner = 'fc70d417-518f-441f-9eb8-55343902f20c' OR name LIKE '%fc70d417-518f-441f-9eb8-55343902f20c%';
DELETE FROM public.profiles WHERE user_id = 'fc70d417-518f-441f-9eb8-55343902f20c';