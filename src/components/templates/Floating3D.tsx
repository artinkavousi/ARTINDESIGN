'use client'

import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { registerTemplate } from './registry'
import { useStore } from '@/lib/store'
import { ScrollReveal } from '../motion/ScrollEffects'

/**
 * Floating3D Props Schema
 */
export const Floating3DSchema = z.object({
  title: z.string(),
  content: z.string(),
  modelType: z.enum(['sphere', 'torus', 'cube', 'icosahedron']).default('sphere'),
  floatSpeed: z.number().min(0).max(3).default(1),
  rotationSpeed: z.number().min(0).max(3).default(0.5),
  scale: z.number().min(0.5).max(3).default(1),
  color: z.string().default('#8b5cf6'),
})

export type Floating3DProps = z.infer<typeof Floating3DSchema>

/**
 * Floating3D Template
 * 
 * Content sections with 3D models that react to scroll.
 * Models float and rotate based on scroll position.
 */
export function Floating3D({
  title,
  content,
  modelType = 'sphere',
  floatSpeed = 1,
  rotationSpeed = 0.5,
  scale = 1,
  color = '#8b5cf6',
}: Floating3DProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const setParams = useStore((state) => state.setParams)

  useEffect(() => {
    // Sync 3D model params to scene
    setParams({
      portfolio: {
        rotationSpeed,
        scale,
        accentColor: color,
        pulsate: true,
        pulseSpeed: rotationSpeed * 1.5,
      },
    })
  }, [rotationSpeed, scale, color, setParams])

  useEffect(() => {
    if (!sectionRef.current) return

    const handleScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const scrollProgress = 1 - (rect.top / window.innerHeight)
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress))

      // Update store with scroll progress for 3D scene
      setParams({ scrollProgress: clampedProgress })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [setParams])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center py-20"
    >
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <h2 className="text-5xl md:text-6xl font-bold mb-8">{title}</h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div
            className="prose prose-lg prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </ScrollReveal>
      </div>

      {/* 3D Model renders in background canvas via scene */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none opacity-30">
        {/* Placeholder - actual 3D renders in WebGPU canvas */}
      </div>
    </section>
  )
}

// Register template
registerTemplate({
  id: 'floating-3d',
  name: 'Floating 3D',
  component: Floating3D,
  description: 'Content sections with floating 3D models that react to scroll',
  schema: Floating3DSchema,
  gsapTracks: ['float', 'rotate'],
  preview: '/templates/floating-3d.jpg',
})


