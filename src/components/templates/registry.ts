import type { ComponentType } from 'react'
import { z } from 'zod'

/**
 * Template metadata and configuration
 */
export interface TemplateConfig {
  id: string
  name: string
  component: ComponentType<any>
  description: string
  schema: z.ZodObject<any>
  gsapTracks?: string[]
  requiredAssets?: string[]
  preview?: string
}

/**
 * Template registry - maps template IDs to their configurations
 */
export const templateRegistry = new Map<string, TemplateConfig>()

/**
 * Register a template in the global registry
 */
export function registerTemplate(config: TemplateConfig) {
  templateRegistry.set(config.id, config)
  return config
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): TemplateConfig | undefined {
  return templateRegistry.get(id)
}

/**
 * Get all registered templates
 */
export function getAllTemplates(): TemplateConfig[] {
  return Array.from(templateRegistry.values())
}

/**
 * Resolve template component with props validation
 */
export function resolveTemplate(id: string, props: any) {
  const template = getTemplate(id)
  
  if (!template) {
    console.warn(`Template "${id}" not found, using default`)
    return null
  }

  // Validate props against schema
  const result = template.schema.safeParse(props)
  
  if (!result.success) {
    console.warn(`Invalid props for template "${id}":`, result.error)
    return null
  }

  return {
    Component: template.component,
    props: result.data,
  }
}


