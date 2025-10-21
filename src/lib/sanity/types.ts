import type { PortableTextBlock } from '@portabletext/types'

export interface SanityImage {
  asset: {
    _ref: string
    _type: 'reference'
  }
}

export interface ProjectLink {
  label?: string
  url?: string
}

export interface ProjectDocument {
  _id: string
  title: string
  slug?: { current: string }
  year?: string
  excerpt?: string
  body?: PortableTextBlock[]
  featured?: boolean
  category?: {
    title?: string
    slug?: string
  }
  technologies?: { _id?: string; title?: string; slug?: string }[]
  coverImageUrl?: string
  galleryUrls?: string[]
  links?: ProjectLink[]
}

