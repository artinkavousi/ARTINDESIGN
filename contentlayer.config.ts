import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'

/**
 * Blog Post Document Type
 */
export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    summary: {
      type: 'string',
      required: true,
    },
    publishedAt: {
      type: 'date',
      required: true,
    },
    updatedAt: {
      type: 'date',
      required: false,
    },
    slug: {
      type: 'string',
      required: true,
    },
    templateId: {
      type: 'string',
      required: false,
      description: 'Template component ID from registry',
    },
    styleId: {
      type: 'string',
      required: false,
      description: 'Style/theme variant ID',
    },
    sceneProps: {
      type: 'json',
      required: false,
      description: 'Props to pass to 3D scene',
    },
    tags: {
      type: 'list',
      of: { type: 'string' },
      required: false,
    },
    cover: {
      type: 'string',
      required: false,
      description: 'Cover image URL',
    },
    featured: {
      type: 'boolean',
      required: false,
      default: false,
    },
    draft: {
      type: 'boolean',
      required: false,
      default: false,
    },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => `/blog/${post.slug}`,
    },
    readingTime: {
      type: 'number',
      resolve: (post) => {
        const wordsPerMinute = 200
        const wordCount = post.body.raw.split(/\s+/g).length
        return Math.ceil(wordCount / wordsPerMinute)
      },
    },
  },
}))

/**
 * Lab Experiment Document Type
 */
export const Lab = defineDocumentType(() => ({
  name: 'Lab',
  filePathPattern: `labs/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    slug: {
      type: 'string',
      required: true,
    },
    category: {
      type: 'enum',
      options: ['shaders', 'particles', 'compute', 'physics', 'audio'],
      required: true,
    },
    difficulty: {
      type: 'enum',
      options: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    tags: {
      type: 'list',
      of: { type: 'string' },
      required: false,
    },
    preview: {
      type: 'string',
      required: false,
      description: 'Preview image/video URL',
    },
    sceneComponent: {
      type: 'string',
      required: true,
      description: 'Path to scene component',
    },
    publishedAt: {
      type: 'date',
      required: true,
    },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (lab) => `/labs/${lab.slug}`,
    },
  },
}))

/**
 * Contentlayer Configuration
 */
export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Lab],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: {
            dark: 'github-dark-dimmed',
            light: 'github-light',
          },
          keepBackground: false,
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: {
            className: ['anchor'],
          },
        },
      ],
    ],
  },
})


