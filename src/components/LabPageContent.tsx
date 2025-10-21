'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useMDXComponent } from 'next-contentlayer/hooks'
import { TemplateLoader } from '@/components/templates/TemplateLoader'
import { PageTransition } from '@/components/motion/PageTransition'

interface LabPageContentProps {
  lab: {
    slug: string
    title: string
    description: string
    category: string
    difficulty: string
    body: {
      code: string
    }
  }
}

export function LabPageContent({ lab }: LabPageContentProps) {
  const setActiveLab = useStore((state) => state.setActiveLab)
  const MDXContent = useMDXComponent(lab.body.code)

  useEffect(() => {
    setActiveLab(lab.slug)
    return () => setActiveLab(null)
  }, [lab.slug, setActiveLab])

  return (
    <PageTransition>
      <main className="min-h-screen pt-32 pb-20">
        <header className="max-w-4xl mx-auto px-6 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
              {lab.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm">
              {lab.difficulty}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">{lab.title}</h1>

          <p className="text-xl text-gray-400 mb-8">{lab.description}</p>

          <div className="flex gap-4">
            <a
              href={`https://github.com/yourrepo/labs/${lab.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              View Source
            </a>
            <a
              href="/labs"
              className="px-6 py-3 rounded-full border border-gray-700 hover:border-gray-600 transition-colors"
            >
              All Labs
            </a>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6">
          <div className="prose prose-lg prose-invert max-w-none">
            <MDXContent
              components={{
                TemplateLoader,
              }}
            />
          </div>
        </div>
      </main>
    </PageTransition>
  )
}

