'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, type Mesh } from 'three'
import { selectHomeParams, selectSceneParams } from '@/lib/store'

import { simplexNoise3d } from '@/lib/tsl'

/**
 * Home Scene - Default rotating icosahedron
 */
export default function HomeScene() {
  const meshRef = useRef<Mesh>(null)
  const materialParams = selectSceneParams().material
  const homeParams = selectHomeParams()

  const palette = useMemo(() => homeParams.palette.map((hex) => new Color(hex)), [homeParams.palette])

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * homeParams.rotationSpeed
      meshRef.current.rotation.y += delta * homeParams.rotationSpeed * 1.2

      const time = state.clock.elapsedTime * homeParams.pulseSpeed
      const noiseValue = simplexNoise3d(
        state.camera.position.x * 0.2,
        state.camera.position.y * 0.2,
        time,
      )

      const pulse = 1 + noiseValue * homeParams.noiseAmplitude
      meshRef.current.scale.set(pulse, pulse, pulse)

      const colorIndex = Math.abs(Math.sin(time * 0.35))
      const colorA = palette[0]
      const colorB = palette[1]
      const colorC = palette[2]
      const blend = colorA.clone().lerp(colorB, colorIndex).lerp(colorC, colorIndex * 0.5)

      meshRef.current.material.color.copy(blend)
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial 
        color={materialParams.baseColor}
        metalness={materialParams.metalness}
        roughness={materialParams.roughness}
      />
    </mesh>
  )
}


