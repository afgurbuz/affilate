import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { createServerComponentClient } from '@/lib/supabase-server'

export default async function AdminDashboard() {
  const supabase = await createServerComponentClient()

  // Get statistics
  const [
    { count: userCount },
    { count: postCount },
    { count: productCount },
    { count: clickCount }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('clicks').select('*', { count: 'exact', head: true })
  ])

  // Recent users
  const { data: recentUsers } = await supabase
    .from('users')
    .select(`
      id,
      username,
      email,
      created_at,
      role:user_roles!inner(name),
      plan:subscription_plans!inner(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select(`
      id,
      caption,
      created_at,
      is_published,
      user:users!inner(username)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Toplam Kullanıcı',
      value: userCount || 0,
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: 'Toplam Post',
      value: postCount || 0,
      icon: '📸',
      color: 'bg-green-500'
    },
    {
      title: 'Toplam Ürün',
      value: productCount || 0,
      icon: '🏷️',
      color: 'bg-purple-500'
    },
    {
      title: 'Toplam Tıklama',
      value: clickCount || 0,
      icon: '👆',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Genel Bakış
        </h1>
        <p className="text-gray-600">
          Platform istatistikleri ve son aktiviteler
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Son Kayıt Olan Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {(user.plan as any)?.name || 'free'}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentUsers || recentUsers.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  Henüz kullanıcı yok
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Son Paylaşılan Postlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts?.map((post) => (
                <div key={post.id} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      @{(post.user as any)?.username || 'unknown'}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {post.caption || 'Açıklama yok'}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('tr-TR')}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      post.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {post.is_published ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentPosts || recentPosts.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  Henüz post yok
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}