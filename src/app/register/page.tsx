'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { validateEmail, validateUsername, generateUsername, getAvatarUrl } from '@/lib/utils'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    
    if (newEmail && !username) {
      setUsername(generateUsername(newEmail))
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!validateEmail(email)) {
      setError('Geçerli bir e-posta adresi girin.')
      setIsLoading(false)
      return
    }

    if (!validateUsername(username)) {
      setError('Kullanıcı adı 3-20 karakter arasında olmalı ve sadece harf, rakam ve _ içermelidir.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            avatar_url: getAvatarUrl(email),
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
      } else if (data.user) {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Hesap oluşturun
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Giriş yapın
            </Link>
          </p>
        </div>

        <Card>
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle>Kayıt Ol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <Input
                label="E-posta"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="ornek@email.com"
                required
              />
              
              <Input
                label="Kullanıcı Adı"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullaniciadi"
                helperText="3-20 karakter, sadece harf, rakam ve _"
                required
              />
              
              <Input
                label="Şifre"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                helperText="Minimum 6 karakter"
                required
              />
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={!email || !password || !username}
              >
                Kayıt Ol
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}