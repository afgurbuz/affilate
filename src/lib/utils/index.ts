export * from './cn'

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export const generateUsername = (email: string) => {
  const username = email.split('@')[0]
  return username.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export const validateUsername = (username: string) => {
  const regex = /^[a-zA-Z0-9_]{3,20}$/
  return regex.test(username)
}

export const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const getAvatarUrl = (email: string) => {
  const hash = btoa(email.toLowerCase())
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random&size=200`
}