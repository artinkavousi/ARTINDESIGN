import { z } from 'zod'

/**
 * Creative Mode Schema
 * Controls for artistic/visual parameters
 */
export const CreativeModeSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#8b5cf6'),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ec4899'),
  }),
  effects: z.object({
    bloom: z.object({
      enabled: z.boolean().default(true),
      threshold: z.number().min(0).max(1).default(0.8),
      intensity: z.number().min(0).max(3).default(1.5),
      radius: z.number().min(0).max(2).default(1),
    }),
    grain: z.object({
      enabled: z.boolean().default(true),
      intensity: z.number().min(0).max(1).default(0.05),
    }),
    vignette: z.object({
      enabled: z.boolean().default(true),
      intensity: z.number().min(0).max(1).default(0.5),
      smoothness: z.number().min(0).max(1).default(0.5),
    }),
  }),
  motion: z.object({
    speed: z.number().min(0).max(5).default(1),
    amplitude: z.number().min(0).max(2).default(1),
    frequency: z.number().min(0).max(10).default(1),
  }),
})

/**
 * Dev Mode Schema
 * Technical controls for debugging and performance
 */
export const DevModeSchema = z.object({
  renderer: z.object({
    backend: z.enum(['webgpu', 'webgl']).default('webgpu'),
    dpr: z.number().min(0.5).max(3).default(1),
    antialias: z.boolean().default(true),
    shadows: z.boolean().default(true),
    toneMapping: z.enum(['none', 'linear', 'reinhard', 'cineon', 'aces']).default('aces'),
  }),
  debug: z.object({
    showFPS: z.boolean().default(false),
    showWireframe: z.boolean().default(false),
    showBounds: z.boolean().default(false),
    showNormals: z.boolean().default(false),
  }),
  performance: z.object({
    maxFPS: z.number().min(30).max(144).default(60),
    pixelRatio: z.number().min(0.5).max(2).default(1),
    shadowMapSize: z.enum(['512', '1024', '2048', '4096']).default('1024'),
  }),
})

/**
 * Combined Admin Schema
 */
export const AdminSchema = z.object({
  creative: CreativeModeSchema,
  dev: DevModeSchema,
})

export type CreativeMode = z.infer<typeof CreativeModeSchema>
export type DevMode = z.infer<typeof DevModeSchema>
export type AdminConfig = z.infer<typeof AdminSchema>

/**
 * Default admin configuration
 */
export const defaultAdminConfig: AdminConfig = {
  creative: {
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
    },
    effects: {
      bloom: {
        enabled: true,
        threshold: 0.8,
        intensity: 1.5,
        radius: 1,
      },
      grain: {
        enabled: true,
        intensity: 0.05,
      },
      vignette: {
        enabled: true,
        intensity: 0.5,
        smoothness: 0.5,
      },
    },
    motion: {
      speed: 1,
      amplitude: 1,
      frequency: 1,
    },
  },
  dev: {
    renderer: {
      backend: 'webgpu',
      dpr: 1,
      antialias: true,
      shadows: true,
      toneMapping: 'aces',
    },
    debug: {
      showFPS: false,
      showWireframe: false,
      showBounds: false,
      showNormals: false,
    },
    performance: {
      maxFPS: 60,
      pixelRatio: 1,
      shadowMapSize: '1024',
    },
  },
}

