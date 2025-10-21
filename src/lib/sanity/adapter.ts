import { createClient } from '@sanity/client'
import groq from 'groq'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2025-01-01'

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
})

const projectFields = `{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  year,
  featured,
  "category": category->{title, "slug": slug.current},
  "technologies": technologies[]->{_id, title, "slug": slug.current},
  "coverImageUrl": coverImage.asset->url,
  "galleryUrls": gallery[]{ asset->url },
  links,
  body,
}`

export async function getProjects() {
  const projects = await sanityClient.fetch(groq`*[_type == "project"] | order(featured desc, year desc) ${projectFields}`)
  return projects.map(mapProjectDocument)
}

export async function getProject(slug: string) {
  const project = await sanityClient.fetch(
    groq`*[_type == "project" && slug.current == $slug][0] ${projectFields}`,
    { slug },
  )
  return project ? mapProjectDocument(project) : null
}

export async function getProjectsByCategory(categorySlug: string) {
  const projects = await sanityClient.fetch(
    groq`*[_type == "project" && category->slug.current == $categorySlug] ${projectFields}`,
    { categorySlug },
  )
  return projects.map(mapProjectDocument)
}

function mapProjectDocument(doc: any) {
  return {
    ...doc,
    coverImageUrl: doc.coverImageUrl,
    galleryUrls: doc.galleryUrls ?? [],
    technologies: doc.technologies ?? [],
  }
}

