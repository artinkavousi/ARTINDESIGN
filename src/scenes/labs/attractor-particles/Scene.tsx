'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { createAttractorSystem } from '@/lib/tsl/compute'
import { useStore } from '@/lib/store'

export default function AttractorParticlesLabScene() {
  const renderer = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const systemRef = useRef<ReturnType<typeof createAttractorSystem> | null>(null)
  const { params } = useStore()

  const attractorParams = useMemo(() => ({
    count: params.labs.attractorParticles?.count || 30000,
    attractorCount: params.labs.attractorParticles?.attractorCount || 3,
    attractorStrength: params.labs.attractorParticles?.attractorStrength || 2.5,
    damping: params.labs.attractorParticles?.damping || 0.98,
    maxSpeed: params.labs.attractorParticles?.maxSpeed || 5.0,
    baseSize: params.labs.attractorParticles?.baseSize || 0.04,
  }), [params.labs.attractorParticles])

  useEffect(() => {
    if (!('computeAsync' in renderer)) {
      console.warn('AttractorParticlesLabScene requires WebGPU renderer with compute support.')
      return
    }

    const system = createAttractorSystem(renderer as any, attractorParams)
    systemRef.current = system

    const initSystem = async () => {
      await system.init()
      
      const mesh = system.createMesh({ additive: true })
      mesh.frustumCulled = false
      scene.add(mesh)
    }

    initSystem()

    return () => {
      if (systemRef.current) {
        systemRef.current.dispose()
      }
    }
  }, [renderer, scene, attractorParams])

  useFrame((state) => {
    if (!systemRef.current) return

    const time = state.clock.elapsedTime
    const attractorCount = attractorParams.attractorCount

    // Animate attractor positions in circular patterns
    for (let i = 0; i < attractorCount; i++) {
      const angle = (i / attractorCount) * Math.PI * 2 + time * 0.5
      const radius = 3 + Math.sin(time * 0.3 + i) * 0.5
      const height = Math.sin(time * 0.7 + i * 1.5) * 2

      systemRef.current.setAttractorPosition(
        i,
        new Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        )
      )
    }

    systemRef.current.uniforms.deltaTime.value = state.clock.getDelta()
    systemRef.current.update()
  })

  return null
}

