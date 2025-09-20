-- ================================
-- SIMPLE STORAGE RLS POLICIES
-- ================================
-- Basit ve çalışır storage policies

BEGIN;

-- Önce mevcut storage policies'leri temizle
-- Temizlik: önce ilgili tüm mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view whisky images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;

-- Yeni ekleyeceğimiz isimlerle çakışmayı önlemek için
DROP POLICY IF EXISTS "authenticated_upload_whisky_images" ON storage.objects;
DROP POLICY IF EXISTS "public_read_whisky_images" ON storage.objects;
DROP POLICY IF EXISTS "owner_or_admin_update_whisky_images" ON storage.objects;
DROP POLICY IF EXISTS "owner_or_admin_delete_whisky_images" ON storage.objects;

-- Basit ve çalışır policies

-- 1. Authenticated kullanıcılar whisky_images bucket'ına upload edebilir
CREATE POLICY "authenticated_upload_whisky_images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'whisky_images'
    AND auth.uid() IS NOT NULL
  );

-- 2. Herkes whisky_images bucket'ından okuyabilir (public bucket)
CREATE POLICY "public_read_whisky_images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'whisky_images');

-- 3. Sadece sahibi veya admin güncelleyebilir
CREATE POLICY "owner_or_admin_update_whisky_images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'whisky_images'
    AND (
      auth_is_admin()
      OR name LIKE auth.uid() || '/%'
    )
  )
  WITH CHECK (
    bucket_id = 'whisky_images'
    AND (
      auth_is_admin()
      OR name LIKE auth.uid() || '/%'
    )
  );

-- 4. Sadece sahibi veya admin silebilir
CREATE POLICY "owner_or_admin_delete_whisky_images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'whisky_images'
    AND (
      auth_is_admin()
      OR name LIKE auth.uid() || '/%'
    )
  );

COMMIT;

-- Verification
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%whisky%';

/*
KULLANIM:
1. Bu SQL'i Supabase Dashboard'da çalıştır
2. whisky_images bucket'ının PUBLIC olarak ayarlandığından emin ol
3. test_storage_buckets.cjs ile test et

Bu basit approach ile upload çalışmalı.
*/
