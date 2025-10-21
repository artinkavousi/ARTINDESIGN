import dynamic from 'next/dynamic'
import { type ComponentType } from 'react'

// Dynamically import scenes (SSR disabled for Three.js)
const HomeScene = dynamic(() => import('@/scenes/home/Scene'), { ssr: false })
const PortfolioScene = dynamic(() => import('@/scenes/portfolio/Scene'), { ssr: false })
const GPUParticlesScene = dynamic(() => import('@/scenes/labs/gpu-particles/Scene'), { ssr: false })
const FlowFieldScene = dynamic(() => import('@/scenes/labs/flow-field/Scene'), { ssr: false })
const FluidSimulationScene = dynamic(() => import('@/scenes/labs/fluid-simulation/Scene'), { ssr: false })
const MorphParticlesScene = dynamic(() => import('@/scenes/labs/morph-particles/Scene'), { ssr: false })
const AttractorParticlesScene = dynamic(() => import('@/scenes/labs/attractor-particles/Scene'), { ssr: false })

// Scene map: pathname → component
const sceneMap: Record<string, ComponentType<any>> = {
  '/': HomeScene,
  '/portfolio': PortfolioScene,
  '/labs/gpu-particles': GPUParticlesScene,
  '/labs/flow-field': FlowFieldScene,
  '/labs/fluid-simulation': FluidSimulationScene,
  '/labs/morph-particles': MorphParticlesScene,
  '/labs/attractor-particles': AttractorParticlesScene,
}

/**
 * Resolve scene component based on current pathname
 * @param pathname - Current route pathname
 * @returns Scene component or default HomeScene
 */
export function resolveScene(pathname: string): ComponentType<any> {
  if (sceneMap[pathname]) {
    return sceneMap[pathname]
  }

  const labMatch = /^\/labs\/(.+)/.exec(pathname)
  if (labMatch) {
    if (sceneMap[`/labs/${labMatch[1]}`]) {
      return sceneMap[`/labs/${labMatch[1]}`]
    }
  }

  return HomeScene
}

/**
 * Get all available scene routes
 */
export function getSceneRoutes(): string[] {
  return Object.keys(sceneMap)
}

