-- Migration: payment-screenshots storage bucket

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own payment screenshots" ON storage.objects;

CREATE POLICY "Authenticated users upload payment screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read access to payment screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'payment-screenshots');

CREATE POLICY "Users delete own payment screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
