# 📱 Gardrop - Instagram Benzeri Affiliate Platform

Instagram benzeri tasarımda, kullanıcıların fotoğraf paylaştığı ve fotoğraftaki ürünlere affiliate linkler ekleyebildiği sosyal ticaret platformu.

## ✨ Özellikler

- 🔐 **Güvenli Authentication** - Supabase auth ile giriş/kayıt
- 👥 **Rol-based Sistem** - Admin ve kullanıcı rolleri
- 💎 **Subscription Planları** - Free, Basic, Premium, Pro planları
- 📷 **Post Paylaşımı** - Instagram benzeri fotoğraf paylaşımı
- 🏷️ **Ürün Etiketleme** - Fotoğraf üzerinde interaktif ürün etiketleme
- 🔗 **Affiliate Tracking** - Tıklama sayısı ve gelir tracking
- 📊 **Analytics Dashboard** - Detaylı istatistikler
- 📱 **Responsive Design** - Mobil-first tasarım
- 🚀 **Performance** - Next.js 14 ve Tailwind CSS

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **UI Components**: Custom components
- **State Management**: React Context
- **Image Storage**: Supabase Storage

## 🚀 Kurulum

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd gardrop
npm install
```

### 2. Supabase Projesini Kurun

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'da `supabase-schema.sql` dosyasını çalıştırın
4. Storage'da `posts` bucket'ını oluşturun ve public yapın

### 3. Environment Variables

`.env.local` dosyasını oluşturun:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Development Server

```bash
npm run dev
```

Uygulamayı [http://localhost:3000](http://localhost:3000) adresinde açın.

## 📊 Database Schema

Proje aşağıdaki ana tablolarla çalışır:

- **users** - Kullanıcı profilleri ve plan bilgileri
- **posts** - Paylaşılan fotoğraflar
- **products** - Fotoğraflardaki etiketli ürünler
- **clicks** - Affiliate link tıklamaları
- **subscription_plans** - Üyelik planları
- **user_roles** - Kullanıcı rolleri

Detaylı şema için `supabase-schema.sql` dosyasına bakın.

## 👥 Kullanıcı Rolleri

### Admin
- Tüm kullanıcıları yönetme
- Plan değiştirme
- Platform analytics
- Content moderation

### User (Üyelik Planları)
- **Free**: 3 post, post başına 3 ürün
- **Basic**: 9 post, post başına 5 ürün
- **Premium**: Sınırsız post ve ürün
- **Pro**: Premium + analytics + özel temalar

## 🎯 Ana Özellikler

### Post Yönetimi
- Fotoğraf yükleme (Supabase Storage)
- Post açıklaması ekleme
- Yayınlama/gizleme
- Post düzenleme ve silme

### Ürün Etiketleme
- Fotoğraf üzerinde koordinat-based etiketleme
- Drag & drop ürün yerleştirme
- Affiliate URL ekleme
- Ürün açıklaması ve detayları

### Public Profiller
- Instagram benzeri grid layout
- Kullanıcı bilgileri ve istatistikleri
- Post detay modali
- Ürün tıklama tracking

### Analytics
- Affiliate link tıklama sayıları
- Gelir tracking
- Plan kullanım istatistikleri
- Zaman bazlı analizler

## 🚀 Production Deployment

### Vercel'e Deploy

1. GitHub'a push edin
2. [Vercel](https://vercel.com) hesabınızla bağlayın
3. Environment variables'ları ekleyin
4. Deploy edin

### Environment Variables (Production)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── [username]/         # Public profil sayfaları
│   ├── dashboard/          # Kullanıcı paneli
│   ├── login/              # Giriş sayfası
│   └── register/           # Kayıt sayfası
├── components/             # React bileşenleri
│   ├── auth/               # Authentication components
│   ├── posts/              # Post related components
│   ├── profile/            # Profil components
│   └── ui/                 # UI components
├── lib/                    # Utility functions
│   ├── auth.ts             # Auth helpers
│   ├── supabase.ts         # Supabase client
│   └── utils/              # Utility functions
├── types/                  # TypeScript type definitions
└── middleware.ts           # Next.js middleware
```

## 🔧 Geliştirme

### Yeni Özellik Ekleme
1. `PROJECT_PLAN.md` dosyasını güncelleyin
2. Gerekli database değişikliklerini yapın
3. TypeScript tiplerini güncelleyin
4. Component'leri geliştirin
5. Sayfaları oluşturun

### Database Değişiklikleri
1. Supabase SQL Editor'da değişiklikleri yapın
2. `supabase-schema.sql` dosyasını güncelleyin
3. TypeScript tiplerini güncelleyin

## 🐛 Sorun Giderme

### Authentication Sorunları
- Supabase URL ve API key'lerin doğru olduğundan emin olun
- RLS policy'lerin doğru ayarlandığını kontrol edin

### Database Bağlantı Sorunları
- Environment variables'ları kontrol edin
- Supabase service role key'in doğru olduğundan emin olun

### Build Hataları
- TypeScript hatalarını kontrol edin
- Import path'lerin doğru olduğundan emin olun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Email: support@gardrop.com
# affilate
