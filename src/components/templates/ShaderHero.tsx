'use client'

import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { registerTemplate } from './registry'
import { useStore } from '@/lib/store'

/**
 * ShaderHero Props Schema
 */
export const ShaderHeroSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  shaderType: z.enum(['noise', 'wave', 'particles', 'fluid']).default('noise'),
  intensity: z.number().min(0).max(2).default(1),
  speed: z.number().min(0).max(5).default(1),
  colorPrimary: z.string().default('#6366f1'),
  colorSecondary: z.string().default('#8b5cf6'),
})

export type ShaderHeroProps = z.infer<typeof ShaderHeroSchema>

/**
 * ShaderHero Template
 * 
 * Full-screen animated shader background behind typography.
 * Syncs with 3D scene through Zustand store.
 */
export function ShaderHero({
  title,
  subtitle,
  shaderType = 'noise',
  intensity = 1,
  speed = 1,
  colorPrimary = '#6366f1',
  colorSecondary = '#8b5cf6',
}: ShaderHeroProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const setParams = useStore((state) => state.setParams)

  useEffect(() => {
    // Sync shader params to 3D scene
    setParams({
      home: {
        palette: [colorPrimary, colorSecondary, '#ffffff'],
        rotationSpeed: speed * 0.35,
        noiseAmplitude: intensity * 0.5,
        pulseSpeed: speed,
      },
    })
  }, [shaderType, intensity, speed, colorPrimary, colorSecondary, setParams])

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content Layer */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1
          ref={titleRef}
          className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary})`,
          }}
        >
          {title}
        </h1>
        
        {subtitle && (
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)`,
        }}
      />
    </div>
  )
}

// Register template
registerTemplate({
  id: 'shader-hero',
  name: 'Shader Hero',
  component: ShaderHero,
  description: 'Animated shader background behind typography',
  schema: ShaderHeroSchema,
  gsapTracks: ['intro', 'pulse'],
  preview: '/templates/shader-hero.jpg',
})


