import { Post } from 'contentlayer/generated'
import type { Metadata } from 'next'

export function metadataFromPost(post: Post): Metadata {
  const url = post.url ?? `/blog/${post.slug}`

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      url,
      images: post.cover ? [post.cover] : undefined,
    },
    alternates: {
      canonical: url,
    },
  }
}

export const formatPostDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })


