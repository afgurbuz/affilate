'use client'

import type { Post } from '@/types'

interface PostGridProps {
  posts: Post[]
  onPostClick: (post: Post) => void
}

export default function PostGrid({ posts, onPostClick }: PostGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="aspect-square relative cursor-pointer group overflow-hidden rounded-none md:rounded-lg"
          onClick={() => onPostClick(post)}
        >
          <img
            src={post.image_url}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-4">
              {(post.product_count || 0) > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{post.product_count || 0}</span>
                </div>
              )}
            </div>
          </div>

          {/* Product count indicator */}
          {(post.product_count || 0) > 0 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
              {post.product_count || 0}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}