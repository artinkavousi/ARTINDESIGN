'use client'

import dynamic from 'next/dynamic'

// Dynamically import ThreeCanvas without SSR to avoid React BatchConfig errors during build
const ThreeCanvas = dynamic(
  () => import('./ThreeCanvas').then((mod) => ({ default: mod.ThreeCanvas })),
  { ssr: false }
)

export function CanvasWrapper() {
  return <ThreeCanvas />
}


