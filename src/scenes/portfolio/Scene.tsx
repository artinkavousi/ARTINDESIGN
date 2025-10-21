'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, MeshStandardMaterial } from 'three'
import { color, mix, vec3 } from 'three/tsl'

import { selectPortfolioParams, selectSceneParams } from '@/lib/store'

/**
 * Portfolio Scene - Rotating cube
 */
export default function PortfolioScene() {
  const meshRef = useRef<Mesh>(null)
  const materialParams = selectSceneParams().material
  const portfolioParams = selectPortfolioParams()
  const gl = useThree((state) => state.gl)

  const material = useMemo(() => {
    const mat = new MeshStandardMaterial()

    mat.onBeforeCompile = (shader) => {
      const cPrimary = color(vec3(materialParams.baseColor))
      const cAccent = color(vec3(portfolioParams.accentColor))
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        /* glsl */ `
          vec3 primaryColor = ${cPrimary.build()};
          vec3 accentColor = ${cAccent.build()};
          float fresnel = pow(1.0 - saturate(dot(normalize(vNormal), normalize(-vViewPosition))), 3.0);
          vec3 mixedColor = mix(primaryColor, accentColor, saturate(vUv.y + fresnel * 0.45));
          diffuseColor.rgb = mixedColor;
        `,
      )
    }

    return mat
  }, [materialParams.baseColor, portfolioParams.accentColor])

  useFrame((state, delta) => {
    if (!meshRef.current) {
      return
    }

    const speed = portfolioParams.rotationSpeed
    meshRef.current.rotation.x += delta * speed
    meshRef.current.rotation.y += delta * speed

    if (portfolioParams.pulsate) {
      const oscillation =
        0.15 * Math.sin(state.clock.elapsedTime * portfolioParams.pulseSpeed)
      const nextScale = portfolioParams.scale + oscillation
      meshRef.current.scale.set(nextScale, nextScale, nextScale)
    } else {
      meshRef.current.scale.setScalar(portfolioParams.scale)
    }
  })

  return (
    <mesh ref={meshRef} material={material}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
    </mesh>
  )
}


