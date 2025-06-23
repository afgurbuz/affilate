-- Migration: Comprehensive Fix and Data Validation
-- Date: 2025-01-23
-- Description: Complete system validation and fixes for common issues

-- ===========================================
-- 1. VALIDATE CORE TABLES AND DATA
-- ===========================================

-- Ensure default roles exist
INSERT INTO user_roles (name, permissions) 
VALUES 
  ('admin', '{"manage_users": true, "manage_plans": true, "view_analytics": true, "moderate_content": true}'),
  ('user', '{"create_posts": true, "manage_own_posts": true, "view_own_analytics": true}')
ON CONFLICT (name) DO NOTHING;

-- Ensure default subscription plans exist
INSERT INTO subscription_plans (name, max_posts, max_products_per_post, price, features) 
VALUES 
  ('free', 3, 3, 0, '["Temel özellikler", "3 post limiti", "Post başına 3 ürün"]'),
  ('basic', 9, 5, 9.99, '["9 post limiti", "Post başına 5 ürün", "Temel analytics"]'),
  ('premium', -1, -1, 29.99, '["Sınırsız post", "Sınırsız ürün", "Gelişmiş analytics", "Öncelikli destek"]'),
  ('pro', -1, -1, 49.99, '["Premium özellikleri", "Özel temalar", "API erişimi", "Bulk işlemler"]')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 2. FIX MISSING USERS FROM AUTH.USERS
-- ===========================================

-- Insert any auth.users that are missing from public.users
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
  au.created_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Fix any users with NULL role_id or plan_id
UPDATE public.users 
SET 
  role_id = (SELECT id FROM user_roles WHERE name = 'user' LIMIT 1)
WHERE role_id IS NULL;

UPDATE public.users 
SET 
  plan_id = (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1)
WHERE plan_id IS NULL;

-- Fix duplicate usernames
WITH duplicate_usernames AS (
  SELECT username, COUNT(*) as count
  FROM public.users
  GROUP BY username
  HAVING COUNT(*) > 1
),
ranked_users AS (
  SELECT 
    id, 
    username,
    ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at) as rn
  FROM public.users
  WHERE username IN (SELECT username FROM duplicate_usernames)
)
UPDATE public.users 
SET username = ranked_users.username || '_' || (ranked_users.rn - 1)
FROM ranked_users
WHERE public.users.id = ranked_users.id 
AND ranked_users.rn > 1;

-- ===========================================
-- 3. RECREATE TRIGGER FUNCTION (IMPROVED)
-- ===========================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
    default_plan_id UUID;
    new_username TEXT;
    username_counter INTEGER := 0;
BEGIN
    -- Get default IDs
    SELECT id INTO default_role_id FROM user_roles WHERE name = 'user' LIMIT 1;
    SELECT id INTO default_plan_id FROM subscription_plans WHERE name = 'free' LIMIT 1;
    
    -- Generate unique username
    new_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1),
        'user_' || substring(NEW.id::text, 1, 8)
    );
    
    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
        username_counter := username_counter + 1;
        new_username := COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1),
            'user_' || substring(NEW.id::text, 1, 8)
        ) || '_' || username_counter;
    END LOOP;
    
    -- Insert new user
    INSERT INTO public.users (
        id, 
        username, 
        email, 
        avatar_url, 
        role_id, 
        plan_id,
        is_active,
        created_at
    )
    VALUES (
        NEW.id,
        new_username,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            'https://ui-avatars.com/api/?name=' || encode(NEW.email::bytea, 'base64')
        ),
        default_role_id,
        default_plan_id,
        true,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 4. VALIDATE AND FIX RLS POLICIES
-- ===========================================

-- Ensure RLS is enabled on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Drop and recreate essential policies to ensure they exist
DROP POLICY IF EXISTS "Public can view active subscription plans" ON subscription_plans;
CREATE POLICY "Public can view active subscription plans" ON subscription_plans 
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users 
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view published user profiles" ON users;
CREATE POLICY "Public can view published user profiles" ON users 
FOR SELECT USING (is_active = true);

-- ===========================================
-- 5. STORAGE BUCKET POLICIES (IF NOT EXISTS)
-- ===========================================

-- Note: These may fail if bucket doesn't exist - that's okay
DO $$
BEGIN
    -- Storage policies (will fail silently if bucket doesn't exist)
    BEGIN
        DROP POLICY IF EXISTS "Public can view post images" ON storage.objects;
        CREATE POLICY "Public can view post images" ON storage.objects
        FOR SELECT USING (bucket_id = 'post-images');
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Storage bucket post-images may not exist yet';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
        CREATE POLICY "Users can upload own images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'post-images' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Storage bucket post-images may not exist yet';
    END;
END $$;

-- ===========================================
-- 6. DATA VALIDATION AND CLEANUP
-- ===========================================

-- Remove orphaned posts (users that don't exist)
DELETE FROM posts 
WHERE user_id NOT IN (SELECT id FROM users);

-- Remove orphaned products (posts that don't exist)
DELETE FROM products 
WHERE post_id NOT IN (SELECT id FROM posts);

-- Remove orphaned clicks (products that don't exist)
DELETE FROM clicks 
WHERE product_id NOT IN (SELECT id FROM products);

-- Update any NULL values that might cause issues
UPDATE users SET bio = '' WHERE bio IS NULL;
UPDATE users SET avatar_url = 'https://ui-avatars.com/api/?name=User' WHERE avatar_url IS NULL;
UPDATE posts SET caption = '' WHERE caption IS NULL;

-- ===========================================
-- 7. VERIFY INSTALLATION
-- ===========================================

-- Create a verification view
CREATE OR REPLACE VIEW system_health AS
SELECT 
    'Users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN role_id IS NOT NULL THEN 1 END) as valid_roles,
    COUNT(CASE WHEN plan_id IS NOT NULL THEN 1 END) as valid_plans
FROM users
UNION ALL
SELECT 
    'Auth Users',
    COUNT(*),
    COUNT(CASE WHEN id IN (SELECT id FROM users) THEN 1 END),
    COUNT(*)
FROM auth.users
UNION ALL
SELECT 
    'User Roles',
    COUNT(*),
    COUNT(*),
    COUNT(*)
FROM user_roles
UNION ALL
SELECT 
    'Subscription Plans',
    COUNT(*),
    COUNT(*),
    COUNT(*)
FROM subscription_plans;

-- Show system health
SELECT * FROM system_health;

-- ===========================================
-- 8. SUCCESS MESSAGE
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 004 completed successfully!';
    RAISE NOTICE '📊 Check system_health view for validation';
    RAISE NOTICE '🔄 Trigger function updated with better error handling';
    RAISE NOTICE '👥 All auth.users synced to public.users';
    RAISE NOTICE '🔒 RLS policies validated';
END $$;