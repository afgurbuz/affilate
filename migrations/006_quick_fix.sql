-- Migration: Quick Fix for Current Issues
-- Date: 2025-01-23
-- Description: Simple fixes for immediate deployment

-- ===========================================
-- 1. ENSURE BASIC DATA EXISTS
-- ===========================================

-- Ensure default roles exist
INSERT INTO user_roles (name, permissions) 
VALUES 
  ('admin', '{"manage_users": true, "manage_plans": true, "view_analytics": true}'),
  ('user', '{"create_posts": true, "manage_own_posts": true}')
ON CONFLICT (name) DO NOTHING;

-- Ensure default subscription plans exist
INSERT INTO subscription_plans (name, max_posts, max_products_per_post, price, features) 
VALUES 
  ('free', 3, 3, 0.00, '["3 post limiti", "Post başına 3 ürün"]'),
  ('basic', 9, 5, 9.99, '["9 post limiti", "Post başına 5 ürün"]'),
  ('premium', -1, -1, 29.99, '["Sınırsız post", "Sınırsız ürün"]'),
  ('pro', -1, -1, 49.99, '["Premium özellikleri", "API erişimi"]')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 2. SYNC MISSING USERS (SAFE)
-- ===========================================

-- Only sync users that exist in auth.users but not in public.users
INSERT INTO public.users (id, username, email, role_id, plan_id, is_active, created_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1),
    'user_' || substring(au.id::text, 1, 8)
  ) as username,
  au.email,
  (SELECT id FROM user_roles WHERE name = 'user' LIMIT 1),
  (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1),
  true,
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
  AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 3. FIX NULL VALUES
-- ===========================================

-- Fix users with missing role_id or plan_id
UPDATE public.users 
SET role_id = (SELECT id FROM user_roles WHERE name = 'user' LIMIT 1)
WHERE role_id IS NULL;

UPDATE public.users 
SET plan_id = (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1)
WHERE plan_id IS NULL;

-- Fix NULL bios and avatars
UPDATE public.users 
SET bio = '' 
WHERE bio IS NULL;

UPDATE public.users 
SET avatar_url = 'https://ui-avatars.com/api/?name=' || COALESCE(username, 'User')
WHERE avatar_url IS NULL;

-- ===========================================
-- 4. CLEAN UP BAD DATA
-- ===========================================

-- Remove posts without valid users
DELETE FROM posts 
WHERE user_id NOT IN (SELECT id FROM users);

-- Remove products without valid posts
DELETE FROM products 
WHERE post_id NOT IN (SELECT id FROM posts);

-- Remove clicks without valid products
DELETE FROM clicks 
WHERE product_id NOT IN (SELECT id FROM products);

-- ===========================================
-- 5. SHOW SUMMARY
-- ===========================================

DO $$
DECLARE
    user_count INTEGER;
    post_count INTEGER;
    auth_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO post_count FROM public.posts;
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    
    RAISE NOTICE '🎉 Migration 006 completed successfully!';
    RAISE NOTICE '👥 Auth users: %', auth_count;
    RAISE NOTICE '👤 Public users: %', user_count;
    RAISE NOTICE '📸 Posts: %', post_count;
    
    IF auth_count > user_count THEN
        RAISE NOTICE '⚠️  % users still need syncing', (auth_count - user_count);
    ELSE
        RAISE NOTICE '✅ All users synced properly';
    END IF;
END $$;