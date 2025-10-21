import { create } from 'zustand'

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export type SceneParams = {
  material: {
    baseColor: string
    metalness: number
    roughness: number
    emissivePulse: boolean
  }
  postfx: {
    bloom: boolean
    bloomStrength: number
    grain: boolean
    grainStrength: number
  }
  renderer: 'webgpu' | 'webgl' | 'auto'
  debugNormals: boolean
  maxFPS: number
  home: {
    rotationSpeed: number
    noiseAmplitude: number
    pulseSpeed: number
    palette: [string, string, string]
  }
  portfolio: {
    rotationSpeed: number
    pulsate: boolean
    pulseSpeed: number
    scale: number
    accentColor: string
  }
  labs: {
    activeLab: string | null
    sparkParticles: {
      count: number
      sparkSpeed: number
      sparkSpread: number
      gravity: number
      sparkLifeDecay: number
      pointerRadius: number
      baseParticleSize: number
    }
    flowField: {
      count: number
      turbulenceAmplitude: number
      turbulenceFrequency: number
      wanderingSpeed: number
      pointerRadius: number
      baseScale: number
    }
    fluidSimulation: {
      resolution: number
      worldSize: number
      heightScale: number
      waveSpeed: number
      damping: number
      pointerRadius: number
      ambientJitter: number
      baseDrift: number
    }
    morphParticles: {
      count: number
      attractionStrength: number
      noiseAmplitude: number
      noiseFrequency: number
      damping: number
      pointerStrength: number
      baseSize: number
    }
    attractorParticles: {
      count: number
      attractorCount: number
      attractorStrength: number
      damping: number
      maxSpeed: number
      baseSize: number
    }
  }
} & Record<string, any>

type StoreState = {
  params: SceneParams
  setParam: (path: string, value: any) => void
  setParams: (updates: Record<string, any>) => void
  reset: () => void
  setActiveLab: (slug: string | null) => void
}

const defaultParams: SceneParams = {
  material: {
    baseColor: '#34d399',
    metalness: 0.2,
    roughness: 0.35,
    emissivePulse: true,
  },
  postfx: {
    bloom: true,
    bloomStrength: 0.65,
    grain: false,
    grainStrength: 0.05,
  },
  renderer: 'auto',
  debugNormals: false,
  maxFPS: 60,
  home: {
    rotationSpeed: 0.35,
    noiseAmplitude: 0.45,
    pulseSpeed: 1.25,
    palette: ['#22d3ee', '#6366f1', '#ec4899'],
  },
  portfolio: {
    rotationSpeed: 0.5,
    pulsate: true,
    pulseSpeed: 2.5,
    scale: 1.5,
    accentColor: '#38bdf8',
  },
  labs: {
    activeLab: null,
    sparkParticles: {
      count: 20000,
      sparkSpeed: 2,
      sparkSpread: 1.5,
      gravity: 2,
      sparkLifeDecay: 1,
      pointerRadius: 1.2,
      baseParticleSize: 0.035,
    },
    flowField: {
      count: 12000,
      turbulenceAmplitude: 0.8,
      turbulenceFrequency: 0.4,
      wanderingSpeed: 0.004,
      pointerRadius: 8,
      baseScale: 0.25,
    },
    fluidSimulation: {
      resolution: 160,
      worldSize: 7.5,
      heightScale: 0.65,
      waveSpeed: 0.24,
      damping: 0.985,
      pointerRadius: 0.12,
      ambientJitter: 0.0015,
      baseDrift: 0.23,
    },
    morphParticles: {
      count: 12000,
      attractionStrength: 4.5,
      noiseAmplitude: 0.45,
      noiseFrequency: 0.6,
      damping: 0.89,
      pointerStrength: 1.25,
      baseSize: 0.035,
    },
    attractorParticles: {
      count: 30000,
      attractorCount: 3,
      attractorStrength: 2.5,
      damping: 0.98,
      maxSpeed: 5.0,
      baseSize: 0.04,
    },
  },
}

const deepClone = <T,>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

const setByPath = (target: Record<string, any>, path: string, value: any) => {
  const keys = path.split('.')
  const next = deepClone(target)
  let node: Record<string, any> = next

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      node[key] = value
    } else {
      if (typeof node[key] !== 'object' || node[key] === null) {
        node[key] = {}
      }
      node = node[key]
    }
  })

  return next
}

const mergeParams = (target: SceneParams, updates: Record<string, any>) => {
  let next = deepClone(target)

  for (const [key, value] of Object.entries(updates)) {
    if (key.includes('.')) {
      next = setByPath(next, key, value)
      continue
    }

    const currentValue = next[key]
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue)
    ) {
      next[key] = {
        ...currentValue,
        ...deepClone(value),
      }
    } else {
      next[key] = value
    }
  }

  return next
}

export const useStore = create<StoreState>((set) => ({
  params: deepClone(defaultParams),

  setParam: (path: string, value: any) => {
    set((state) => ({
      params: setByPath(state.params, path, value),
    }))
  },

  setParams: (updates: Record<string, any>) => {
    set((state) => ({
      params: mergeParams(state.params, updates),
    }))
  },

  reset: () => set({ params: deepClone(defaultParams) }),

  setActiveLab: (slug: string | null) => {
    set((state) => ({
      params: {
        ...state.params,
        labs: {
          ...state.params.labs,
          activeLab: slug,
        },
      },
    }))
  },
}))

export const useSceneParams = () => useStore((state) => state.params)
export const useMaterialParams = () => useStore((state) => state.params.material)
export const useHomeParams = () => useStore((state) => state.params.home)
export const usePortfolioParams = () => useStore((state) => state.params.portfolio)
export const useLabParams = () => useStore((state) => state.params.labs)

