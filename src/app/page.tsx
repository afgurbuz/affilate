import Link from 'next/link'
import { Button } from '@/components/ui'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl">Gardrop</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login">
            <Button variant="ghost">Giriş Yap</Button>
          </Link>
          <Link href="/register">
            <Button>Kayıt Ol</Button>
          </Link>
        </nav>
      </header>
      
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Instagram Benzeri <br />
                  <span className="text-blue-600">Affiliate Platform</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Fotoğraflarınızı paylaşın, ürünleri etiketleyin ve affiliate linklerle kazanç elde edin. 
                  Sosyal ticareti yeniden tanımlıyoruz.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg">Hemen Başla</Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg">Özellikler</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 px-10 md:gap-16 lg:grid-cols-3">
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
                <h3 className="text-xl font-bold">Fotoğraf Paylaşımı</h3>
                <p className="text-gray-500">
                  Instagram benzeri arayüzle fotoğraflarınızı kolayca paylaşın.
                </p>
              </div>
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏷️</span>
                </div>
                <h3 className="text-xl font-bold">Ürün Etiketleme</h3>
                <p className="text-gray-500">
                  Fotoğraflarınızdaki ürünleri etiketleyin ve affiliate linkler ekleyin.
                </p>
              </div>
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-xl font-bold">Kazanç Elde Edin</h3>
                <p className="text-gray-500">
                  Affiliate linklerinizden tıklama ve satış başına komisyon kazanın.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Hazır mısın?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl">
                  Ücretsiz kayıt olun ve hemen paylaşmaya başlayın.
                </p>
              </div>
              <Link href="/register">
                <Button size="lg">Ücretsiz Başla</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">© 2024 Gardrop. Tüm hakları saklıdır.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Gizlilik Politikası
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Kullanım Şartları
          </Link>
        </nav>
      </footer>
    </div>
  )
}
