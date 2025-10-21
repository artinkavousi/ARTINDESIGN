import { notFound } from 'next/navigation'
import { allLabs } from 'contentlayer/generated'
import { Metadata } from 'next'
import { LabPageContent } from '@/components/LabPageContent'

interface LabPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return allLabs.map((lab) => ({
    slug: lab.slug,
  }))
}

export async function generateMetadata({ params }: LabPageProps): Promise<Metadata> {
  const lab = allLabs.find((l) => l.slug === params.slug)

  if (!lab) {
    return {
      title: 'Lab Not Found',
    }
  }

  return {
    title: `${lab.title} – Labs`,
    description: lab.description,
    openGraph: {
      title: lab.title,
      description: lab.description,
      type: 'article',
      url: lab.url,
      images: lab.preview ? [lab.preview] : undefined,
    },
  }
}

export default function LabPage({ params }: LabPageProps) {
  const lab = allLabs.find((l) => l.slug === params.slug)

  if (!lab) {
    notFound()
  }

  return <LabPageContent lab={lab} />
}

