-- Migration: Add Storage Bucket Policies for Post Images
-- Date: 2025-01-23
-- Description: Creates RLS policies for the 'post-images' storage bucket

-- Storage bucket policies for post images
-- Note: Run this AFTER creating the 'post-images' bucket in Supabase Storage UI

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