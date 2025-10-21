import { PageTransition, StaggerContainer, StaggerItem } from '@/components/motion/PageTransition'
import Link from 'next/link'
import Image from 'next/image'
import { getProjects } from '@/lib/sanity'
import type { ProjectDocument } from '@/lib/sanity/types'

export const metadata = {
  title: 'Portfolio - Creative Projects',
  description: 'Showcase of WebGPU projects and creative experiments',
}

export default async function PortfolioPage() {
  const projects = (await getProjects()) as ProjectDocument[]
  const featuredProjects = projects.filter((project) => project.featured)
  const otherProjects = projects.filter((project) => !project.featured)

  return (
    <PageTransition>
      <main className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Portfolio</h1>
            <p className="text-xl text-gray-400 max-w-2xl">
              A collection of WebGPU projects, creative experiments, and interactive experiences
            </p>
          </div>

          {/* Featured Projects */}
          {featuredProjects.length > 0 && (
            <section className="mb-32">
              <h2 className="text-3xl font-bold mb-12">Featured Projects</h2>
              
              <StaggerContainer className="grid gap-12">
                {featuredProjects.map((project) => (
              <StaggerItem key={project._id}>
                <FeaturedProjectCard project={project} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}

          {/* Other Projects */}
          {otherProjects.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-12">More Projects</h2>
              
              <StaggerContainer className="grid md:grid-cols-2 gap-8">
                {otherProjects.map((project) => (
              <StaggerItem key={project._id}>
                <ProjectCard project={project} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}

          {/* CTA */}
          <div className="mt-32 text-center">
            <div className="p-12 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <h3 className="text-3xl font-bold mb-4">Interested in collaborating?</h3>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                I&apos;m always open to discussing new projects, creative ideas, or opportunities.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="mailto:hello@example.com"
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-full font-semibold transition-all hover:scale-105"
                >
                  Get in Touch
                </a>
                <a
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 border border-gray-700 hover:border-gray-600 rounded-full font-semibold transition-all hover:scale-105"
                >
                  View GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  )
}

function FeaturedProjectCard({ project }: { project: ProjectDocument }) {
  return (
    <Link
      href={`/portfolio/${project.slug?.current ?? ''}`}
      className="group grid md:grid-cols-2 gap-8 rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition-all p-8"
    >
      {/* Image */}
      <div className="aspect-video md:aspect-square rounded-xl overflow-hidden bg-gray-800">
          {project.coverImageUrl ? (
          <Image
            src={project.coverImageUrl}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-6xl">🎨</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-purple-400 font-medium">{project.category}</span>
          <span className="text-sm text-gray-500">• {project.year}</span>
        </div>

        <h3 className="text-3xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
          {project.title}
        </h3>

        <p className="text-gray-400 mb-6">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.technologies?.map((tech) => (
            <span key={tech._key ?? tech.slug?.current ?? tech.title} className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm">
              {tech.title}
            </span>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-2 text-purple-400">
          View Project
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function ProjectCard({ project }: { project: ProjectDocument }) {
  return (
    <Link
      href={`/portfolio/${project.slug?.current ?? ''}`}
      className="group block rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition-all hover:scale-[1.02]"
    >
      {/* Image */}
      <div className="aspect-video overflow-hidden bg-gray-800">
          {project.coverImageUrl ? (
          <Image
            src={project.coverImageUrl}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-5xl">🎨</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          {project.category?.title && (
            <span className="text-xs text-purple-400 font-medium">{project.category.title}</span>
          )}
          {project.year && <span className="text-xs text-gray-500">• {project.year}</span>}
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
          {project.title}
        </h3>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.technologies?.slice(0, 3).map((tech) => (
            <span
              key={tech._key ?? tech.slug?.current ?? tech.title}
              className="px-2 py-1 rounded-full bg-gray-800 text-gray-300 text-xs"
            >
              {tech.title}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

