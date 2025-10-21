'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Vector3, Plane } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { createMorphParticleSystem } from '@/lib/tsl/compute'
import { useStore } from '@/lib/store'

// Helper to generate sphere positions
function generateSpherePositions(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * Math.cbrt(Math.random())
    
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  
  return positions
}

// Helper to generate cube positions
function generateCubePositions(count: number, size: number): Float32Array {
  const positions = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * size
    positions[i * 3 + 1] = (Math.random() - 0.5) * size
    positions[i * 3 + 2] = (Math.random() - 0.5) * size
  }
  
  return positions
}

// Helper to generate torus positions
function generateTorusPositions(count: number, majorRadius: number, minorRadius: number): Float32Array {
  const positions = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2
    const v = Math.random() * Math.PI * 2
    
    positions[i * 3 + 0] = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u)
    positions[i * 3 + 1] = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u)
    positions[i * 3 + 2] = minorRadius * Math.sin(v)
  }
  
  return positions
}

export default function MorphParticlesLabScene() {
  const renderer = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const systemRef = useRef<ReturnType<typeof createMorphParticleSystem> | null>(null)
  const { params } = useStore()
  const morphShapeRef = useRef<'sphere' | 'cube' | 'torus'>('sphere')

  useEffect(() => {
    if (!('computeAsync' in renderer)) {
      console.warn('MorphParticlesLabScene requires WebGPU renderer with compute support.')
      return
    }

    const plane = new Plane(new Vector3(0, 0, 1), 0)
    
    const morphParams = params.labs.morphParticles || {
      count: 12000,
      attractionStrength: 4.5,
      noiseAmplitude: 0.45,
      noiseFrequency: 0.6,
      damping: 0.89,
      pointerStrength: 1.25,
      baseSize: 0.035,
    }
    
    const system = createMorphParticleSystem(renderer as any, camera, plane, {
      count: morphParams.count,
      attractionStrength: morphParams.attractionStrength,
      noiseAmplitude: morphParams.noiseAmplitude,
      noiseFrequency: morphParams.noiseFrequency,
      damping: morphParams.damping,
      pointerStrength: morphParams.pointerStrength,
      baseSize: morphParams.baseSize,
      colorA: '#38bdf8',
      colorB: '#f472b6',
    })

    systemRef.current = system

    const initSystem = async () => {
      const initialPositions = generateSpherePositions(morphParams.count, 1.5)
      const initialTargets = generateSpherePositions(morphParams.count, 1.5)
      
      await system.init(initialPositions, initialTargets)
      
      const mesh = system.createMesh({ additive: true })
      mesh.frustumCulled = false
      scene.add(mesh)
      
      // Start morphing cycle
      let currentShape: 'sphere' | 'cube' | 'torus' = 'sphere'
      const morphInterval = setInterval(async () => {
        const shapes: Array<'sphere' | 'cube' | 'torus'> = ['sphere', 'cube', 'torus']
        const currentIndex = shapes.indexOf(currentShape)
        currentShape = shapes[(currentIndex + 1) % shapes.length]
        morphShapeRef.current = currentShape
        
        let newTargets: Float32Array
        
        switch (currentShape) {
          case 'sphere':
            newTargets = generateSpherePositions(morphParams.count, 1.5)
            break
          case 'cube':
            newTargets = generateCubePositions(morphParams.count, 2.8)
            break
          case 'torus':
            newTargets = generateTorusPositions(morphParams.count, 1.2, 0.5)
            break
        }
        
        await system.setTargets(newTargets)
      }, 5000)

      return () => {
        clearInterval(morphInterval)
      }
    }

    const cleanup = initSystem()

    return () => {
      cleanup.then(clear => clear?.())
      system.pointer.destroy()
      system.dispose()
    }
  }, [renderer, camera, scene, params.labs.morphParticles])

  useFrame((state, delta) => {
    if (systemRef.current) {
      systemRef.current.pointer.update(delta)
      systemRef.current.update()
    }
  })

  return null
}

