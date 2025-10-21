/**
 * Random sphere position distribution for TSL
 * Generates uniformly distributed random positions on/in a sphere
 * @module tsl/utils/position/sphere-rand
 */

import { Fn, PI2, hash, instanceIndex, vec3 } from 'three/tsl'

/**
 * Generate random position inside a sphere with uniform volume distribution
 * Uses cube root for proper 3D distribution
 */
export const positionSphereRand = Fn<{ radius: number }>(({ radius }) => {
  const seed = hash(instanceIndex.add(1))
  const seed2 = hash(instanceIndex.add(2))
  const seed3 = hash(instanceIndex.add(3))

  // Cube root for uniform volume distribution
  const distanceFactor = seed.pow(1 / 3)

  // Spherical coordinates
  const theta = seed2.mul(PI2)
  const phi = seed3.acos().mul(2).sub(1)

  // Convert to Cartesian
  const x = distanceFactor.mul(phi.sin().mul(theta.cos())).mul(radius)
  const y = distanceFactor.mul(phi.sin().mul(theta.sin())).mul(radius)
  const z = distanceFactor.mul(phi.cos()).mul(radius)

  return vec3(x, y, z)
})

/**
 * Generate random position on sphere surface only
 */
export const positionSphereSurface = Fn<{ radius: number }>(({ radius }) => {
  const seed = hash(instanceIndex.add(1))
  const seed2 = hash(instanceIndex.add(2))

  const theta = seed.mul(PI2)
  const phi = seed2.acos().mul(2).sub(1)

  const x = phi.sin().mul(theta.cos()).mul(radius)
  const y = phi.sin().mul(theta.sin()).mul(radius)
  const z = phi.cos().mul(radius)

  return vec3(x, y, z)
})

