import { Fn, vec3, float } from 'three/tsl'
import { simplexNoise3d } from '@/lib/tsl/noise/simplex_noise_3d'
import { EPSILON } from 'three/tsl'

/**
 * Computes the gradient (spatial derivative) of simplex noise at the given position.
 * Useful for flow fields or steering behaviours that require directional information.
 */
export const gradientNoise3d = Fn(([position]) => {
  const delta = float(EPSILON)

  const baseNoise = simplexNoise3d(position).toVar()

  const noiseX = simplexNoise3d(position.add(vec3(delta, 0, 0))).sub(baseNoise).div(delta)
  const noiseY = simplexNoise3d(position.add(vec3(0, delta, 0))).sub(baseNoise).div(delta)
  const noiseZ = simplexNoise3d(position.add(vec3(0, 0, delta))).sub(baseNoise).div(delta)

  return vec3(noiseX, noiseY, noiseZ)
})


