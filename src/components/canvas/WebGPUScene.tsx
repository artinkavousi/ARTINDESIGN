'use client'

import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, Preload, OrthographicCamera } from '@react-three/drei'
import { useState, type ReactNode } from 'react'
import { WebGPURenderer } from 'three/webgpu'
import { ColorSpaceCorrection } from './ColorCorrection'

type SceneProps = {
  debug?: boolean
  frameloop?: 'always' | 'demand' | 'never'
  orthographic?: boolean
  children?: ReactNode
} & any

/**
 * WebGPUScene
 *
 * Renders a three.js scene using the WebGPURenderer inside a @react-three/fiber Canvas.
 * Adapted for Next.js with async WebGPU initialization and WebGL fallback.
 *
 * @param {SceneProps} props - Scene configuration props
 * @param {boolean} [props.debug=false] - Show WebGL stats overlay
 * @param {'always'|'demand'|'never'} [props.frameloop='always'] - Canvas render loop mode
 * @param {boolean} [props.orthographic=false] - Use orthographic camera
 * @param {React.ReactNode} props.children - Scene children
 * @returns {JSX.Element}
 */
export function WebGPUScene({ 
  debug = false, 
  frameloop = 'always', 
  orthographic = false, 
  children, 
  ...props 
}: SceneProps) {
  const [canvasFrameloop, setCanvasFrameloop] = useState<'always' | 'demand' | 'never'>('never')

  return (
    <Canvas
      id='__webgpucanvas'
      {...props}
      frameloop={canvasFrameloop}
      gl={async (props) => {
        const renderer = new WebGPURenderer(props as any)
        await renderer.init()
        setCanvasFrameloop(frameloop)
        return renderer
      }}
    >
      <Preload all />
      <AdaptiveDpr />
      
      {children}
      
      <ColorSpaceCorrection />
      
      {orthographic && <OrthographicCamera makeDefault position={[0, 0, 1]} />}
    </Canvas>
  )
}

