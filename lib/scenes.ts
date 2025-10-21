import dynamic from 'next/dynamic'
import { type ComponentType } from 'react'

// Dynamically import scenes (SSR disabled for Three.js)
const HomeScene = dynamic(() => import('@/scenes/home/Scene'), { ssr: false })
const PortfolioScene = dynamic(() => import('@/scenes/portfolio/Scene'), { ssr: false })

// Scene map: pathname → component
const sceneMap: Record<string, ComponentType<any>> = {
  '/': HomeScene,
  '/portfolio': PortfolioScene,
  // Labs routes handled separately with dynamic slugs
}

/**
 * Resolve scene component based on current pathname
 * @param pathname - Current route pathname
 * @returns Scene component or default HomeScene
 */
export function resolveScene(pathname: string): ComponentType<any> {
  // Direct match
  if (sceneMap[pathname]) {
    return sceneMap[pathname]
  }
  
  // Check if it's a labs route
  if (pathname.startsWith('/labs/')) {
    const slug = pathname.replace('/labs/', '')
    try {
      return dynamic(() => import(`@/scenes/labs/${slug}/Scene`), { ssr: false })
    } catch {
      return HomeScene
    }
  }
  
  // Default fallback
  return HomeScene
}

/**
 * Get all available scene routes
 */
export function getSceneRoutes(): string[] {
  return Object.keys(sceneMap)
}


