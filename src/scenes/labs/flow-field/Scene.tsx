'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Plane, Vector3 } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { createFlowFieldSystem } from '@/lib/tsl/compute'
import { useStore } from '@/lib/store'

export default function FlowFieldScene() {
  const renderer = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const systemRef = useRef<ReturnType<typeof createFlowFieldSystem> | null>(null)
  const { params } = useStore()
  const flowParams = params.labs.flowField

  useEffect(() => {
    if (!('computeAsync' in renderer)) {
      console.warn('FlowFieldScene requires WebGPU renderer with compute support.')
      return
    }

    const plane = new Plane(new Vector3(0, 0, 1), 0)
    const system = createFlowFieldSystem(renderer as any, camera as any, plane, {
      count: flowParams.count,
      turbulenceAmplitude: flowParams.turbulenceAmplitude,
      turbulenceFrequency: flowParams.turbulenceFrequency,
      wanderingSpeed: flowParams.wanderingSpeed,
      pointerRadius: flowParams.pointerRadius,
      baseScale: flowParams.baseScale,
    })

    systemRef.current = system

    const mesh = system.createMesh()
    scene.add(mesh)

    const geometry = new Float32Array(system.count * 3)
    for (let i = 0; i < system.count; i++) {
      geometry[i * 3 + 0] = (Math.random() - 0.5) * 6
      geometry[i * 3 + 1] = (Math.random() - 0.5) * 6
      geometry[i * 3 + 2] = (Math.random() - 0.5) * 6
    }

    system.init(geometry)

    return () => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as any).dispose()
      system.dispose()
    }
  }, [renderer, camera, scene, flowParams])

  useFrame((_, delta) => {
    const system = systemRef.current
    if (!system) return

    system.pointer.update(delta)
    system.update()
  })

  return null
}

