import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import PublicProfile from '@/components/profile/PublicProfile'
import type { User, Post } from '@/types'

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createServerComponentClient()

  try {
    // Fetch user by username
    const { data: userData, error: userError } = await supabase
      .from('user_details')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      notFound()
    }

    // Fetch user's published posts
    const { data: postsData, error: postsError } = await supabase
      .from('post_details')
      .select('*')
      .eq('user_id', userData.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
    }

    return (
      <PublicProfile 
        user={userData as User} 
        posts={(postsData as Post[]) || []} 
      />
    )
  } catch (error) {
    console.error('Error in ProfilePage:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createServerComponentClient()

  try {
    const { data: userData } = await supabase
      .from('user_details')
      .select('username, bio, avatar_url')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (!userData) {
      return {
        title: 'Kullanıcı Bulunamadı - Gardrop',
      }
    }

    return {
      title: `${userData.username} - Gardrop`,
      description: userData.bio || `${userData.username} adlı kullanıcının Gardrop profili`,
      openGraph: {
        title: `${userData.username} - Gardrop`,
        description: userData.bio || `${userData.username} adlı kullanıcının Gardrop profili`,
        images: userData.avatar_url ? [userData.avatar_url] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Gardrop',
    }
  }
}