-- Quick fix: Add missing user to public.users table
-- Replace the ID below with your actual user ID from console (73f1c5b4-5102-42e2-80ac-6ebdd5036e3b)

INSERT INTO public.users (id, username, email, role_id, plan_id)
VALUES (
  '73f1c5b4-5102-42e2-80ac-6ebdd5036e3b', -- Your user ID from console
  'testuser', -- Choose a username
  (SELECT email FROM auth.users WHERE id = '73f1c5b4-5102-42e2-80ac-6ebdd5036e3b'), -- Get email from auth.users
  (SELECT id FROM user_roles WHERE name = 'user'),
  (SELECT id FROM subscription_plans WHERE name = 'free')
)
ON CONFLICT (id) DO NOTHING;