'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { registerTemplate } from './registry'
import { useStore } from '@/lib/store'

/**
 * Gallery3D Props Schema
 */
export const Gallery3DSchema = z.object({
  title: z.string(),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
  })),
  layout: z.enum(['carousel', 'grid', 'spiral']).default('carousel'),
  autoPlay: z.boolean().default(false),
  autoPlayInterval: z.number().min(1000).max(10000).default(3000),
  depth: z.number().min(0).max(10).default(2),
})

export type Gallery3DProps = z.infer<typeof Gallery3DSchema>

/**
 * Gallery3D Template
 * 
 * Image gallery with 3D depth effects.
 * Images are positioned in 3D space with parallax and transitions.
 */
export function Gallery3D({
  title,
  images,
  layout = 'carousel',
  autoPlay = false,
  autoPlayInterval = 3000,
  depth = 2,
}: Gallery3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const setParams = useStore((state) => state.setParams)

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, images.length])

  // Sync gallery state to 3D scene
  useEffect(() => {
    setParams({
      galleryLayout: layout,
      galleryCurrentIndex: currentIndex,
      galleryDepth: depth,
      galleryImages: images.map(img => img.src),
    })
  }, [layout, currentIndex, depth, images, setParams])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <div className="my-20">
      {/* Header */}
      <div className="mb-12 text-center">
        <h3 className="text-4xl md:text-5xl font-bold mb-4">{title}</h3>
        <p className="text-gray-400">
          {images.length} image{images.length !== 1 ? 's' : ''} •{' '}
          {layout.charAt(0).toUpperCase() + layout.slice(1)} layout
        </p>
      </div>

      {/* Main Gallery */}
      <div className="relative max-w-6xl mx-auto">
        {/* Current Image Display */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
          <img
            key={currentIndex}
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            className="w-full h-full object-cover transition-opacity duration-500"
          />

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all group"
            aria-label="Previous image"
          >
            <svg
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all group"
            aria-label="Next image"
          >
            <svg
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Caption */}
          {images[currentIndex].caption && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-lg">{images[currentIndex].caption}</p>
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-all
                ${index === currentIndex
                  ? 'border-purple-500 scale-110'
                  : 'border-gray-800 hover:border-gray-700'
                }
              `}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Counter */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 max-w-2xl mx-auto p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
        <p className="text-purple-300 text-sm text-center">
          💡 <strong>3D Mode Active:</strong> Images are positioned in 3D space.
          Use arrow keys to navigate. The scene depth adjusts based on scroll position.
        </p>
      </div>
    </div>
  )
}

// Register template
registerTemplate({
  id: 'gallery-3d',
  name: 'Gallery 3D',
  component: Gallery3D,
  description: 'Image gallery with 3D depth effects and carousel navigation',
  schema: Gallery3DSchema,
  gsapTracks: ['slideTransition', 'depthShift'],
  requiredAssets: ['images'],
  preview: '/templates/gallery-3d.jpg',
})


