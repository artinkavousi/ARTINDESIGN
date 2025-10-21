'use client'

import { Suspense, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { WebGPUScene } from './canvas/WebGPUScene'
import { resolveScene } from '@/lib/scenes'

/**
 * ThreeCanvas - Persistent WebGPU canvas across all routes
 * 
 * Renders a fixed-position canvas with route-based scene switching.
 * The canvas persists across navigation, only the scene content changes.
 */
export function ThreeCanvas() {
  const pathname = usePathname()
  const Scene = useMemo(() => resolveScene(pathname || '/'), [pathname])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <WebGPUScene 
        frameloop="always"
        orthographic={false}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        
        {/* Global lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
      </WebGPUScene>
    </div>
  )
}


