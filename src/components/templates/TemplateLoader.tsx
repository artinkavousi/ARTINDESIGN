'use client'

import { resolveTemplate } from './registry'

// Import all templates to ensure they're registered
import './ShaderHero'
import './Floating3D'
import './ParticleScroll'
import './CodePlayground'
import './Gallery3D'

interface TemplateLoaderProps {
  templateId: string
  props: Record<string, any>
}

/**
 * TemplateLoader - Dynamically loads and renders templates
 * 
 * Used in blog posts and pages to render registered templates
 * with validated props.
 */
export function TemplateLoader({ templateId, props }: TemplateLoaderProps) {
  const resolved = resolveTemplate(templateId, props)

  if (!resolved) {
    return (
      <div className="p-8 border border-yellow-500/50 rounded-lg bg-yellow-500/10">
        <p className="text-yellow-500">
          Template &quot;{templateId}&quot; not found or invalid props
        </p>
      </div>
    )
  }

  const { Component, props: validatedProps } = resolved

  return <Component {...validatedProps} />
}

/**
 * Default export for MDX usage
 */
export default TemplateLoader

