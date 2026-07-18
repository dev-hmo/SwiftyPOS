-- Migration: payment-screenshots storage bucket
-- Creates a Supabase Storage bucket for payment verification screenshots
-- submitted during the upgrade request flow.

-- Create the bucket (public read so admins can view screenshots)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  true,
  5242880,  -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects
-- Authenticated users can upload to their own tenant folder
CREATE POLICY "Authenticated users upload payment screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public can read payment screenshots (for admin review)
CREATE POLICY "Public read access to payment screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'payment-screenshots');

-- Users can delete their own uploads (in case of wrong file)
CREATE POLICY "Users delete own payment screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
