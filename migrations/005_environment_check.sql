-- Migration: Environment and Connection Validation
-- Date: 2025-01-23
-- Description: Validate database connectivity and create test data

-- ===========================================
-- ENVIRONMENT VALIDATION
-- ===========================================

-- Check if we can access auth schema
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        RAISE EXCEPTION 'Auth schema not accessible. Check RLS policies and permissions.';
    END IF;
    
    RAISE NOTICE '✅ Auth schema accessible';
END $$;

-- Check if trigger function exists and works
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
    ) THEN
        RAISE EXCEPTION 'Trigger function handle_new_user does not exist';
    END IF;
    
    RAISE NOTICE '✅ Trigger function exists';
END $$;

-- ===========================================
-- CREATE TEST DATA (SAFE)
-- ===========================================

-- Create a test user entry ONLY if there's a corresponding auth.users entry
INSERT INTO public.users (
    id, 
    username, 
    email, 
    bio,
    avatar_url,
    role_id, 
    plan_id,
    is_active
)
SELECT 
    '00000000-0000-0000-0000-000000000001', -- Test UUID
    'testuser_system',
    'test@gardrop.com',
    'Bu sistem test kullanıcısıdır. Test amaçlı oluşturulmuştur.',
    'https://ui-avatars.com/api/?name=Test+User&background=random',
    (SELECT id FROM user_roles WHERE name = 'user' LIMIT 1),
    (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1),
    true
WHERE EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Create a test post if test user exists in both auth.users and public.users
INSERT INTO public.posts (
    id,
    user_id,
    image_url,
    caption,
    is_published
)
SELECT 
    uuid_generate_v4(), -- Generate random UUID for post
    '00000000-0000-0000-0000-000000000001',
    'https://picsum.photos/600/600?random=1',
    'Bu test postudur. Gardrop platformunun çalışıp çalışmadığını test etmek için oluşturulmuştur.',
    true
WHERE EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = '00000000-0000-0000-0000-000000000001'
)
AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = '00000000-0000-0000-0000-000000000001'
);

-- ===========================================
-- DIAGNOSTIC QUERIES
-- ===========================================

-- Show current user count and any issues
WITH user_stats AS (
    SELECT 
        COUNT(*) as total_auth_users,
        COUNT(CASE WHEN au.id IN (SELECT id FROM public.users) THEN 1 END) as synced_users,
        COUNT(CASE WHEN au.id NOT IN (SELECT id FROM public.users) THEN 1 END) as missing_users
    FROM auth.users au
),
public_user_stats AS (
    SELECT 
        COUNT(*) as total_public_users,
        COUNT(CASE WHEN role_id IS NOT NULL THEN 1 END) as users_with_roles,
        COUNT(CASE WHEN plan_id IS NOT NULL THEN 1 END) as users_with_plans,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
    FROM public.users
)
SELECT 
    'User Sync Status' as metric,
    json_build_object(
        'auth_users', us.total_auth_users,
        'synced_users', us.synced_users,
        'missing_users', us.missing_users,
        'public_users', pus.total_public_users,
        'users_with_roles', pus.users_with_roles,
        'users_with_plans', pus.users_with_plans,
        'active_users', pus.active_users
    ) as data
FROM user_stats us, public_user_stats pus;

-- Show any users with problems
SELECT 
    'Problematic Users' as metric,
    json_agg(
        json_build_object(
            'id', id,
            'username', username,
            'email', email,
            'has_role', role_id IS NOT NULL,
            'has_plan', plan_id IS NOT NULL,
            'is_active', is_active
        )
    ) as data
FROM public.users
WHERE role_id IS NULL OR plan_id IS NULL OR is_active IS NULL;

-- Show table row counts
SELECT 
    'Table Counts' as metric,
    json_build_object(
        'user_roles', (SELECT COUNT(*) FROM user_roles),
        'subscription_plans', (SELECT COUNT(*) FROM subscription_plans),
        'users', (SELECT COUNT(*) FROM users),
        'posts', (SELECT COUNT(*) FROM posts),
        'products', (SELECT COUNT(*) FROM products),
        'clicks', (SELECT COUNT(*) FROM clicks)
    ) as data;

-- ===========================================
-- FINAL VALIDATION
-- ===========================================

DO $$
DECLARE
    auth_count INTEGER;
    public_count INTEGER;
    missing_count INTEGER;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO public_count FROM public.users;
    missing_count := auth_count - public_count;
    
    RAISE NOTICE '📊 Database Status:';
    RAISE NOTICE '   Auth users: %', auth_count;
    RAISE NOTICE '   Public users: %', public_count;
    RAISE NOTICE '   Missing sync: %', missing_count;
    
    IF missing_count > 0 THEN
        RAISE NOTICE '⚠️  Some auth.users are not synced to public.users';
        RAISE NOTICE '   Run migration 004 to fix this';
    ELSE
        RAISE NOTICE '✅ All users properly synced';
    END IF;
    
    -- Test basic queries
    PERFORM * FROM users LIMIT 1;
    PERFORM * FROM user_roles LIMIT 1;
    PERFORM * FROM subscription_plans LIMIT 1;
    
    RAISE NOTICE '✅ All basic queries working';
    RAISE NOTICE '🎉 Database validation complete!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Validation failed: %', SQLERRM;
        RAISE EXCEPTION 'Database validation failed';
END $$;