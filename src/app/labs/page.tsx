import { allLabs } from 'contentlayer/generated'
import Image from 'next/image'
import Link from 'next/link'

import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/PageTransition'

export const metadata = {
  title: 'Labs - WebGPU Experiments',
  description: 'Interactive WebGPU and TSL experiments',
}

export default function LabsPage() {
  const labs = allLabs
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return (
    <PageTransition>
      <main className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Labs</h1>
            <p className="text-xl text-gray-400 max-w-2xl">
              Interactive experiments showcasing WebGPU, TSL, compute shaders, fluids, and creative GPU workflows.
            </p>
          </header>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <StaggerItem key={lab.slug}>
                <LabCard lab={lab} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </main>
    </PageTransition>
  )
}

function LabCard({ lab }: { lab: (typeof allLabs)[number] }) {
  const difficultyColors: Record<string, string> = {
    beginner: 'text-green-400 bg-green-400/10',
    intermediate: 'text-yellow-400 bg-yellow-400/10',
    advanced: 'text-red-400 bg-red-400/10',
  }

  return (
    <Link
      href={`/labs/${lab.slug}`}
      className="group rounded-2xl overflow-hidden bg-gray-900/40 border border-gray-800 hover:border-purple-500/50 transition-all"
    >
      <div className="aspect-video bg-gray-800 overflow-hidden relative">
        {lab.preview ? (
          <Image
            src={lab.preview}
            alt={lab.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-6xl">🚧</span>
          </div>
        )}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/80 text-xs font-medium">
          {lab.category}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[lab.difficulty] ?? 'bg-gray-700 text-gray-300'}`}>
            {lab.difficulty}
          </span>
          <time className="text-xs text-gray-500" dateTime={lab.publishedAt}>
            {new Date(lab.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{lab.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-3">{lab.description}</p>

        <div className="mt-4 text-purple-400 text-sm flex items-center gap-2">
          View lab →
        </div>
      </div>
    </Link>
  )
}

