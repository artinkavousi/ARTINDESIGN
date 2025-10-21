'use client'

import { useFrame, useThree, type RootState } from '@react-three/fiber'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { sin, time, uv, vec3, type NodeRepresentation } from 'three/tsl'
import { type ReactNode } from 'react'

/**
 * Template implementation for a WebGPU sketch mesh.
 */
const TemplateImpl = ({ colorNode, onFrame }: { colorNode?: NodeRepresentation, onFrame?: (material: MeshBasicNodeMaterial, state: RootState) => void }) => {
  const material = new MeshBasicNodeMaterial({ transparent: true })
  const _uv = uv()

  const _colorNode = colorNode ?? vec3(_uv, sin(time))
  material.colorNode = _colorNode

  const { width, height } = useThree((state) => state.viewport)

  useFrame((state) => {
    if (onFrame) {
      onFrame(material, state)
    }
  })

  return (
    <mesh material={material} scale={[width, height, 1]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}

export type WebGPUSketchProps = {
  colorNode?: NodeRepresentation
  onFrame?: (material: MeshBasicNodeMaterial, state: RootState) => void
  children?: ReactNode
}

/**
 * WebGPU sketch component. Renders children or a default template mesh.
 */
export function WebGPUSketch({ colorNode, onFrame, children }: WebGPUSketchProps) {
  return <>{children ?? <TemplateImpl colorNode={colorNode} onFrame={onFrame} />}</>
}


