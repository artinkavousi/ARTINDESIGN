import { create } from 'zustand'

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
}

type StoreState = {
  params: SceneParams
  setParam: (path: string, value: any) => void
  reset: () => void
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
}

export const useStore = create<StoreState>((set, get) => ({
  params: defaultParams,
  
  setParam: (path: string, value: any) => {
    const keys = path.split('.')
    set((state) => {
      const newParams = JSON.parse(JSON.stringify(state.params))
      let obj: any = newParams
      
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]]
      }
      
      obj[keys[keys.length - 1]] = value
      return { params: newParams }
    })
  },
  
  reset: () => set({ params: defaultParams }),
}))


