-- ================================
-- STORAGE BUCKET RLS POLICIES
-- ================================
-- Bu script, whisky_images bucket'ı için RLS politikalarını kurar

BEGIN;

-- Storage Objects tablosu için RLS politikaları

-- 1. Authenticated kullanıcılar dosya upload edebilir
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'whisky_images'
    AND auth.role() = 'authenticated'
  );

-- 2. Herkes public dosyaları görebilir
CREATE POLICY "Public can view whisky images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'whisky_images'
  );

-- 3. Dosya sahipleri kendi dosyalarını güncelleyebilir
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'whisky_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  ) WITH CHECK (
    bucket_id = 'whisky_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Dosya sahipleri ve adminler dosyaları silebilir
CREATE POLICY "Users and admins can delete images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'whisky_images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- 5. Adminler tüm dosyalara erişebilir
CREATE POLICY "Admins can manage all images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'whisky_images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) WITH CHECK (
    bucket_id = 'whisky_images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

COMMIT;

-- ================================
-- VERIFICATION
-- ================================

-- Storage policies'leri kontrol et
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%whisky%';

-- ================================
-- USAGE NOTES
-- ================================

/*
BUCKET SETUP REQUIRED:
1. Go to Supabase Dashboard → Storage
2. Create bucket named 'whisky_images'
3. Set bucket as PUBLIC
4. Run this SQL script
5. Test upload functionality

FOLDER STRUCTURE:
- whiskies/whisky_image_123.jpg
- whiskies/whisky_image_456.png

SECURITY:
- Authenticated users can upload
- Everyone can view (public bucket)
- Users can manage their own files
- Admins have full access

TESTING:
Run: node tests/test_storage_buckets.cjs
*/