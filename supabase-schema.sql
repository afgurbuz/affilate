-- Supabase Database Schema for Gardrop Platform
-- Run these commands in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default roles
INSERT INTO user_roles (name, permissions) VALUES 
('admin', '{"manage_users": true, "manage_plans": true, "view_analytics": true, "moderate_content": true}'),
('user', '{"create_posts": true, "manage_own_posts": true, "view_own_analytics": true}');

-- Subscription Plans Table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    max_posts INTEGER NOT NULL,
    max_products_per_post INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, max_posts, max_products_per_post, price, features) VALUES 
('free', 3, 3, 0, '["Temel özellikler", "3 post limiti", "Post başına 3 ürün"]'),
('basic', 9, 5, 9.99, '["9 post limiti", "Post başına 5 ürün", "Temel analytics"]'),
('premium', -1, -1, 29.99, '["Sınırsız post", "Sınırsız ürün", "Gelişmiş analytics", "Öncelikli destek"]'),
('pro', -1, -1, 49.99, '["Premium özellikleri", "Özel temalar", "API erişimi", "Bulk işlemler"]');

-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    role_id UUID NOT NULL REFERENCES user_roles(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Posts Table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products Table (tagged products in posts)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    affiliate_url TEXT NOT NULL,
    x_coordinate DECIMAL(5,2) NOT NULL CHECK (x_coordinate >= 0 AND x_coordinate <= 100),
    y_coordinate DECIMAL(5,2) NOT NULL CHECK (y_coordinate >= 0 AND y_coordinate <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clicks Table (for analytics)
CREATE TABLE clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_plan_id ON users(plan_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_products_post_id ON products(post_id);
CREATE INDEX idx_clicks_product_id ON clicks(product_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
CREATE POLICY "Public can view user roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can modify user roles" ON user_roles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role_id = (SELECT id FROM user_roles WHERE name = 'admin')
    )
);

-- Subscription Plans Policies
CREATE POLICY "Public can view active subscription plans" ON subscription_plans 
    FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can modify subscription plans" ON subscription_plans FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role_id = (SELECT id FROM user_roles WHERE name = 'admin')
    )
);

-- Users Policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public can view published user profiles" ON users FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role_id = (SELECT id FROM user_roles WHERE name = 'admin')
    )
);
CREATE POLICY "Admins can modify all users" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role_id = (SELECT id FROM user_roles WHERE name = 'admin')
    )
);

-- Posts Policies
CREATE POLICY "Users can view published posts" ON posts FOR SELECT USING (is_published = true);
CREATE POLICY "Users can manage their own posts" ON posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all posts" ON posts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role_id = (SELECT id FROM user_roles WHERE name = 'admin')
    )
);

-- Products Policies
CREATE POLICY "Users can view products from published posts" ON products FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = products.post_id 
        AND posts.is_published = true
    )
);
CREATE POLICY "Users can manage products in their own posts" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = products.post_id 
        AND posts.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage all products" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role_id = (SELECT id FROM user_roles WHERE name = 'admin')
    )
);

-- Clicks Policies
CREATE POLICY "Anyone can insert clicks" ON clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view clicks on their own products" ON clicks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM products 
        JOIN posts ON posts.id = products.post_id 
        WHERE products.id = clicks.product_id 
        AND posts.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can view all clicks" ON clicks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role_id = (SELECT id FROM user_roles WHERE name = 'admin')
    )
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
    default_plan_id UUID;
BEGIN
    -- Get default role and plan IDs
    SELECT id INTO default_role_id FROM user_roles WHERE name = 'user';
    SELECT id INTO default_plan_id FROM subscription_plans WHERE name = 'free';
    
    INSERT INTO public.users (id, username, email, avatar_url, role_id, plan_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || encode(NEW.email::bytea, 'base64')),
        default_role_id,
        default_plan_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Views for easier querying

-- View for user with role and plan details
CREATE VIEW user_details AS
SELECT 
    u.*,
    ur.name as role_name,
    ur.permissions as role_permissions,
    sp.name as plan_name,
    sp.max_posts,
    sp.max_products_per_post,
    sp.price as plan_price,
    sp.features as plan_features
FROM users u
JOIN user_roles ur ON u.role_id = ur.id
JOIN subscription_plans sp ON u.plan_id = sp.id;

-- View for posts with user details and product count
CREATE VIEW post_details AS
SELECT 
    p.*,
    u.username,
    u.avatar_url as user_avatar,
    COUNT(pr.id) as product_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN products pr ON p.id = pr.post_id AND pr.is_active = true
GROUP BY p.id, u.username, u.avatar_url;

-- View for product analytics
CREATE VIEW product_analytics AS
SELECT 
    pr.*,
    p.caption as post_caption,
    u.username,
    COUNT(c.id) as total_clicks,
    COUNT(CASE WHEN c.clicked_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as clicks_last_30_days,
    COUNT(CASE WHEN c.clicked_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as clicks_last_7_days
FROM products pr
JOIN posts p ON pr.post_id = p.id
JOIN users u ON p.user_id = u.id
LEFT JOIN clicks c ON pr.id = c.product_id
GROUP BY pr.id, p.caption, u.username;

-- Storage bucket policies for post images
-- Run this after creating the 'post-images' bucket in Supabase Storage

-- Allow public read access to post images
CREATE POLICY "Public can view post images" ON storage.objects
FOR SELECT USING (bucket_id = 'post-images');

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);