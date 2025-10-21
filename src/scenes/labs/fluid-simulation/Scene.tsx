'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Plane } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { createFluidSurfaceSimulation } from '@/lib/tsl/compute'
import { selectLabParams } from '@/lib/store'

export default function FluidSimulationScene() {
  const renderer = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const fluidRef = useRef<ReturnType<typeof createFluidSurfaceSimulation> | null>(null)
  const pointerPlane = useMemo(() => new Plane(), [])
  const labParams = selectLabParams()

  useEffect(() => {
    if (!('computeAsync' in renderer)) {
      console.warn('FluidSimulationScene requires WebGPU renderer with compute support.')
      return
    }

    pointerPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(pointerPlane.normal), camera.position)

    const simulation = createFluidSurfaceSimulation(renderer as any, {
      resolution: 176,
      worldSize: 7.5,
      heightScale: 0.65,
      waveSpeed: 0.24 * labParams.shaderTimeScale,
      damping: 0.985,
      pointerRadius: 0.12 + labParams.pointerStrength * 0.05,
      ambientJitter: 0.0015,
      baseDrift: 0.23,
    })

    fluidRef.current = simulation

    const initSimulation = async () => {
      await simulation.init()
      const mesh = simulation.createMesh()
      mesh.rotation.x = -Math.PI / 2
      mesh.scale.set(1, 1, 1)
      scene.add(mesh)
    }

    initSimulation()

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = (event.target as HTMLElement).getBoundingClientRect()
      const u = (event.clientX - bounds.left) / bounds.width
      const v = (event.clientY - bounds.top) / bounds.height
      fluidRef.current?.setPointer(u, 1 - v, labParams.pointerStrength)
    }

    const handlePointerDown = (event: PointerEvent) => {
      const bounds = (event.target as HTMLElement).getBoundingClientRect()
      const u = (event.clientX - bounds.left) / bounds.width
      const v = (event.clientY - bounds.top) / bounds.height
      fluidRef.current?.addDrop(u, 1 - v, Math.max(0.45, labParams.pointerStrength * 1.2))
    }

    const canvasElement = renderer.domElement
    canvasElement.addEventListener('pointermove', handlePointerMove)
    canvasElement.addEventListener('pointerdown', handlePointerDown)

    return () => {
      canvasElement.removeEventListener('pointermove', handlePointerMove)
      canvasElement.removeEventListener('pointerdown', handlePointerDown)
      simulation.dispose()
    }
  }, [renderer, camera, pointerPlane, scene, labParams.pointerStrength, labParams.shaderTimeScale])

  useFrame(async (_, delta) => {
    if (fluidRef.current) {
      await fluidRef.current.update(delta * labParams.shaderTimeScale)
    }
  })

  return <Suspense fallback={null} />
}


