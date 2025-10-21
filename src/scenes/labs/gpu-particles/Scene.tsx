'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Vector3, Plane } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { createSparkParticleSystem, WebGPUPointer } from '@/lib/tsl/compute'
import { selectLabParams } from '@/lib/store'

export default function GPUParticlesLabScene() {
  const renderer = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const pointerRef = useRef<WebGPUPointer | null>(null)
  const labParams = selectLabParams()

  const system = useMemo(() => {
    if (!('computeAsync' in renderer)) {
      throw new Error('WebGPU renderer required for spark particle system')
    }

    return createSparkParticleSystem(renderer as any, {
      count: 20000,
      sparkSpeed: 1.5 + labParams.shaderTimeScale,
      sparkSpread: 1.25 + labParams.pointerStrength * 0.6,
      baseParticleSize: 0.028 + labParams.pointerStrength * 0.01,
    })
  }, [renderer, labParams.pointerStrength, labParams.shaderTimeScale])

  useEffect(() => {
    const plane = new Plane(new Vector3(0, 0, 1), 0)
    pointerRef.current = new WebGPUPointer(renderer as any, camera as any, plane)

    const mesh = system.createMesh({ additive: true })
    mesh.frustumCulled = false
    scene.add(mesh)

    system.init()

    return () => {
      pointerRef.current?.destroy()
      scene.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as any).dispose()
      system.dispose()
    }
  }, [system, renderer, camera, scene])

  useFrame((_, delta) => {
    pointerRef.current?.update(delta * labParams.shaderTimeScale)
    system.setPointerPosition(pointerRef.current?.uPointer.value ?? new Vector3())
    system.setPointerVelocity(pointerRef.current?.uPointerVelocity.value ?? new Vector3())
    system.update()
  })

  return null
}


