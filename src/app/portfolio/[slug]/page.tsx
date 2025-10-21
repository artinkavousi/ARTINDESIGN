import { notFound } from 'next/navigation'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { PageTransition } from '@/components/motion/PageTransition'
import Link from 'next/link'
import { getProject, getProjects } from '@/lib/sanity'
import type { ProjectDocument } from '@/lib/sanity/types'

interface ProjectPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const projects = (await getProjects()) as ProjectDocument[]
  return projects
    .filter((project) => project.slug?.current)
    .map((project) => ({
      slug: project.slug!.current,
    }))
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const project = await getProject(params.slug)

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: `${project.title} - Portfolio`,
    description: project.description,
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.slug)

  if (!project) {
    notFound()
  }

  return (
    <PageTransition>
      <main className="min-h-screen pt-32 pb-20">
        {/* Hero Section */}
        <header className="max-w-6xl mx-auto px-6 mb-16">
          <div className="flex items-center gap-3 mb-6">
            {project.category?.title && (
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                {project.category.title}
              </span>
            )}
            <span className="text-sm text-gray-500">• {project.year}</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            {project.title}
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-3xl">
            {project.description}
          </p>

          <div className="flex gap-4 flex-wrap">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                View Live
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full border border-gray-700 hover:border-gray-600 transition-colors"
              >
                View Source
              </a>
            )}
          </div>
        </header>

        {/* Feature Image */}
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
            {project.coverImageUrl ? (
              <Image
                src={project.coverImageUrl}
                alt={project.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 mb-2 text-4xl">🎨</p>
                  <p className="text-gray-500">Project preview coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="max-w-4xl mx-auto px-6">
          {/* Overview */}
          {project.body && (
            <section className="mb-16 prose prose-invert max-w-none">
              <PortableText value={project.body} />
            </section>
          )}

          {/* Tech Stack */}
          {project.technologies?.length ? (
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Tech Stack</h2>
              <div className="flex flex-wrap gap-3">
                {project.technologies?.map((tech) => (
                  <span key={tech._id ?? tech.slug ?? tech.title} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200">
                    {tech.title}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* Gallery */}
          {project.galleryUrls?.length ? (
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Gallery</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {project.galleryUrls.map((url, index) => (
                  <div key={url ?? index} className="relative aspect-video rounded-xl overflow-hidden border border-gray-800">
                    {url ? (
                      <Image src={url} alt={`${project.title} image ${index + 1}`} fill className="object-cover" />
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Footer Navigation */}
        <footer className="max-w-4xl mx-auto px-6 mt-20 pt-10 border-t border-gray-800">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to portfolio
          </Link>
        </footer>
      </main>
    </PageTransition>
  )
}

