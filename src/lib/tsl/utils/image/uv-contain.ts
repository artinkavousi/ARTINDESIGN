/**
 * CSS object-fit: contain equivalent for textures in TSL
 * Scales texture to fit within plane while maintaining aspect ratio
 * @module tsl/utils/image/uv-contain
 */

import { Fn, float, select, vec2, type ShaderNodeObject } from 'three/tsl'
import type { Node } from 'three/webgpu'

/**
 * Calculate UV coordinates for contain-fit texture mapping
 * @param imgSize - Original image dimensions (width, height)
 * @param planeSize - Plane dimensions (width, height)
 * @param ouv - Original UV coordinates (0-1 range)
 */
export const containTextureUv = Fn<
  [ShaderNodeObject<Node>, ShaderNodeObject<Node>, ShaderNodeObject<Node>]
>(([imgSize_immutable, planeSize_immutable, ouv_immutable]) => {
  const ouv = vec2(ouv_immutable).toVar()
  const planeSize = vec2(planeSize_immutable).toVar()
  const imgSize = vec2(imgSize_immutable).toVar()
  
  const s = vec2(planeSize).toVar()
  const i = vec2(imgSize).toVar()
  const rs = float(s.x.div(s.y)).toVar() // Plane aspect ratio
  const ri = float(i.x.div(i.y)).toVar() // Image aspect ratio
  
  // Calculate scaled dimensions (opposite of cover)
  const newUv = vec2(
    select(
      rs.greaterThan(ri),
      vec2(i.x.mul(s.y).div(i.y), s.y),
      vec2(s.x, i.y.mul(s.x).div(i.x)),
    ),
  ).toVar()
  
  // Calculate offset to center
  const offset = vec2(
    select(
      rs.greaterThan(ri),
      vec2(newUv.x.sub(s.x).div(2.0), 0.0),
      vec2(0.0, newUv.y.sub(s.y).div(2.0)),
    ).div(newUv),
  ).toVar()
  
  const uv = vec2(ouv.mul(s).div(newUv).add(offset))
  return uv
}).setLayout({
  name: 'containTextureUv',
  type: 'vec2',
  inputs: [
    { name: 'imgSize', type: 'vec2' },
    { name: 'planeSize', type: 'vec2' },
    { name: 'ouv', type: 'vec2' },
  ],
})

