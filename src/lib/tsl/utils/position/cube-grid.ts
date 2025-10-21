/**
 * Grid-based cube position distribution for TSL
 * Generates evenly spaced positions in a cubic grid
 * @module tsl/utils/position/cube-grid
 */

import { Fn, float, hash, instanceIndex, vec3 } from 'three/tsl'

/**
 * Generate positions in a 3D grid pattern
 * @param size - Total size of the cube
 * @param count - Number of particles per axis (cube root of total count)
 */
export const positionCubeGrid = Fn<{ size: number; count: number }>(({ size, count }) => {
  const gridSize = float(count)
  const spacing = float(size).div(gridSize.sub(1))
  
  const idx = float(instanceIndex)
  
  // Calculate 3D grid indices
  const x = idx.mod(gridSize)
  const y = idx.div(gridSize).floor().mod(gridSize)
  const z = idx.div(gridSize.mul(gridSize)).floor()
  
  // Convert to world positions (centered at origin)
  const halfSize = float(size).mul(0.5)
  
  return vec3(
    x.mul(spacing).sub(halfSize),
    y.mul(spacing).sub(halfSize),
    z.mul(spacing).sub(halfSize),
  )
})

/**
 * Generate random positions within a cube
 */
export const positionCubeRand = Fn<{ size: number }>(({ size }) => {
  const halfSize = float(size).mul(0.5)
  
  const seed1 = hash(instanceIndex.add(1))
  const seed2 = hash(instanceIndex.add(2))
  const seed3 = hash(instanceIndex.add(3))
  
  return vec3(
    seed1.mul(size).sub(halfSize),
    seed2.mul(size).sub(halfSize),
    seed3.mul(size).sub(halfSize),
  )
})

