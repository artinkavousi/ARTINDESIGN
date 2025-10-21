import { notFound } from 'next/navigation'
import { PageTransition } from '@/components/motion/PageTransition'
import { ScrollReveal } from '@/components/motion/ScrollEffects'
import { allPosts, Post } from 'contentlayer/generated'
import { useMDXComponent } from 'next-contentlayer/hooks'
import { Metadata } from 'next'
import { TemplateLoader } from '@/components/templates/TemplateLoader'
import { metadataFromPost } from '@/lib/content'

interface PostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = allPosts.find((p) => p.slug === params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return metadataFromPost(post)
}

export default function PostPage({ params }: PostPageProps) {
  const post = allPosts.find((p) => p.slug === params.slug)

  if (!post || post.draft) {
    notFound()
  }

  const MDXContent = useMDXComponent(post.body.code)

  return (
    <PageTransition>
      <article className="min-h-screen pt-32 pb-20">
        {/* Article Header */}
        <header className="max-w-4xl mx-auto px-6 mb-16">
          <ScrollReveal>
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-3 py-1 rounded-full bg-purple-500/10 text-purple-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              {post.title}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-xl text-gray-400 mb-8">{post.summary}</p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {post.updatedAt && (
                <>
                  <span>·</span>
                  <span>
                    Updated{' '}
                    {new Date(post.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </>
              )}
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </div>
          </ScrollReveal>
        </header>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg prose-invert prose-purple max-w-none">
            <MDXContent
              components={{
                TemplateLoader,
              }}
            />
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="max-w-4xl mx-auto px-6 mt-20 pt-10 border-t border-gray-800">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to all posts
          </a>
        </footer>
      </article>
    </PageTransition>
  )
}

