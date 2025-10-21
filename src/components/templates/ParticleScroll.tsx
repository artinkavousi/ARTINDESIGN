'use client'

import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { registerTemplate } from './registry'
import { useStore } from '@/lib/store'
import { throttle } from '@/lib/utils'

/**
 * ParticleScroll Props Schema
 */
export const ParticleScrollSchema = z.object({
  title: z.string(),
  content: z.string(),
  particleCount: z.number().min(100).max(10000).default(1000),
  particleSize: z.number().min(1).max(10).default(2),
  mouseInfluence: z.number().min(0).max(1).default(0.5),
  colorStart: z.string().default('#6366f1'),
  colorEnd: z.string().default('#ec4899'),
})

export type ParticleScrollProps = z.infer<typeof ParticleScrollSchema>

/**
 * ParticleScroll Template
 * 
 * Content sections with GPU particles that follow mouse and scroll position.
 * Particles react to cursor movement and scroll velocity.
 */
export function ParticleScroll({
  title,
  content,
  particleCount = 1000,
  particleSize = 2,
  mouseInfluence = 0.5,
  colorStart = '#6366f1',
  colorEnd = '#ec4899',
}: ParticleScrollProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const setParams = useStore((state) => state.setParams)
  const lastScrollY = useRef(0)

  useEffect(() => {
    // Sync particle params to 3D scene
    setParams({
      labs: {
        pointerStrength: mouseInfluence,
        shaderTimeScale: particleSize * 0.02,
        backgroundColor: colorStart,
      },
    })
  }, [particleCount, particleSize, mouseInfluence, colorStart, colorEnd, setParams])

  useEffect(() => {
    if (!sectionRef.current) return

    // Mouse tracking
    const handleMouseMove = throttle((e: MouseEvent) => {
      const rect = sectionRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      setParams({
        mouseX: x * 2 - 1, // Normalize to -1 to 1
        mouseY: -(y * 2 - 1),
      })
    }, 16) // ~60fps

    // Scroll tracking
    const handleScroll = throttle(() => {
      const currentScroll = window.scrollY
      const scrollVelocity = (currentScroll - lastScrollY.current) / 16
      lastScrollY.current = currentScroll

      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const visibility = Math.max(
        0,
        Math.min(1, (window.innerHeight - rect.top) / window.innerHeight)
      )

      setParams({
        scrollVelocity,
        sectionVisibility: visibility,
      })
    }, 16)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [setParams])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center py-32"
    >
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <h2
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8"
          style={{
            background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </h2>

        <div
          className="prose prose-lg prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Move your mouse to interact with particles •{' '}
            Scroll to see them react to velocity
          </p>
        </div>
      </div>

      {/* Particle system renders in background WebGPU canvas */}
      <div className="absolute inset-0 pointer-events-none opacity-70" />
    </section>
  )
}

// Register template
registerTemplate({
  id: 'particle-scroll',
  name: 'Particle Scroll',
  component: ParticleScroll,
  description: 'Interactive GPU particles that follow mouse and scroll',
  schema: ParticleScrollSchema,
  gsapTracks: ['particleFlow', 'colorShift'],
  preview: '/templates/particle-scroll.jpg',
})


