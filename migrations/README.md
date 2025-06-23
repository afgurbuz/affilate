# Database Migrations

Bu klasör Gardrop platformunun veritabanı migration dosyalarını içerir.

## Migration Sırası

Migrationları aşağıdaki sırayla çalıştırın:

### 1. `001_initial_schema.sql` (ZORUNLU)
- Temel veritabanı şeması
- Tüm tablolar, indeksler, RLS politikaları
- Trigger fonksiyonları
- Views (opsiyonel)

### 2. `002_add_storage_policies.sql` (İSTEĞE BAĞLI)
- Supabase Storage bucket politikaları
- **Önemli**: Önce Supabase Dashboard'da `post-images` bucket'ını oluşturun

### 3. `004_comprehensive_fix.sql` (ÖNERİLEN)
- Eksik kullanıcıları auth.users'dan public.users'a senkronize eder
- Trigger fonksiyonunu geliştirir
- RLS politikalarını doğrular
- Orphaned data'yı temizler
- **Bu migration çoğu sorunu çözer!**

### 4. `005_environment_check.sql` (DEBUG)
- Veritabanı durumunu kontrol eder
- Test verisi oluşturur
- Diagnostic bilgiler verir

## Kurulum Adımları

### 1. Supabase Dashboard'da Bucket Oluşturma
1. Supabase Dashboard > Storage
2. "Create a new bucket" tıklayın
3. Bucket adı: `post-images`
4. "Make bucket public" seçeneğini işaretleyin
5. "Create bucket" tıklayın

### 2. Migration Dosyalarını Çalıştırma
1. Supabase Dashboard > SQL Editor
2. `001_initial_schema.sql` dosyasının içeriğini kopyalayın ve çalıştırın
3. `002_add_storage_policies.sql` dosyasının içeriğini kopyalayın ve çalıştırın

## Doğrulama

Migration'ların başarılı olduğunu doğrulamak için:

```sql
-- Tabloları kontrol edin
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Storage politikalarını kontrol edin  
SELECT * FROM pg_policies WHERE schemaname = 'storage';

-- Kullanıcı verilerini kontrol edin
SELECT name FROM user_roles;
SELECT name FROM subscription_plans;
```

## Rollback

Eğer geri almak isterseniz:

```sql
-- Storage politikalarını kaldır
DROP POLICY IF EXISTS "Public can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Tabloları kaldır (DİKKAT: Tüm veri silinir!)
DROP TABLE IF EXISTS clicks CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
```

## Notlar

- Her migration dosyası idempotent olmalıdır (birden fazla çalıştırılabilir)
- Production'da migration çalıştırmadan önce backup alın
- Storage bucket'ı manuel olarak oluşturulmalıdır - SQL ile oluşturulamaz