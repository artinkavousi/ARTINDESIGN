import Link from 'next/link'
import { allPosts } from 'contentlayer/generated'
import { compareDesc } from 'date-fns'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/motion/PageTransition'

export const metadata = {
  title: 'Blog - WebGPU & Creative Coding',
  description: 'Articles about WebGPU, TSL, and creative web development',
}

export default function BlogPage() {
  const publishedPosts = allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(new Date(a.publishedAt), new Date(b.publishedAt)))

  const featuredPosts = publishedPosts.filter((post) => post.featured)
  const regularPosts = publishedPosts.filter((post) => !post.featured)

  return (
    <PageTransition>
      <main className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Blog</h1>
            <p className="text-xl text-gray-400 max-w-2xl">
              Exploring WebGPU, Three.js TSL, and the future of creative web development
            </p>
          </div>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <section className="mb-20">
              <h2 className="text-3xl font-bold mb-8">Featured</h2>
              <StaggerContainer className="grid gap-8 md:grid-cols-2">
                {featuredPosts.map((post) => (
                  <StaggerItem key={post.slug}>
                    <PostCard post={post} featured />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}

          {/* All Posts */}
          <section>
            <h2 className="text-3xl font-bold mb-8">All Posts</h2>
            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post) => (
                <StaggerItem key={post.slug}>
                  <PostCard post={post} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        </div>
      </main>
    </PageTransition>
  )
}

function PostCard({ post, featured = false }: { post: any; featured?: boolean }) {
  return (
    <Link
      href={post.url}
      className={`
        block group rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-800
        hover:border-gray-700 hover:bg-gray-900/70 transition-all duration-300
        ${featured ? 'md:col-span-1' : ''}
      `}
    >
      {/* Cover Image */}
      {post.cover && (
        <div className="aspect-video overflow-hidden bg-gray-800">
          <img
            src={post.cover}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-6">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className={`font-bold mb-2 group-hover:text-purple-400 transition-colors ${featured ? 'text-2xl' : 'text-xl'}`}>
          {post.title}
        </h3>

        {/* Summary */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.summary}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span>·</span>
          <span>{post.readingTime} min read</span>
        </div>
      </div>
    </Link>
  )
}

