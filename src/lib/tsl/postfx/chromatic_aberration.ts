/**
 * Chromatic Aberration Post-Processing Effect for TSL/WebGPU
 * Simulates lens distortion by separating RGB channels
 * @module tsl/postfx/chromatic-aberration
 */

import { Fn, texture, uv as uvNode, vec2, uniform, float } from 'three/tsl'
import type { Texture } from 'three'

/**
 * Chromatic aberration effect - separates RGB channels radially from center
 * @param sceneTexture - Input texture from scene
 * @param intensity - Strength of the effect (0-1, default 0.5)
 */
export const chromaticAberration = Fn<{ sceneTexture: Texture; intensity?: number }>(
  ({ sceneTexture, intensity = 0.5 }) => {
    const uv = uvNode()
    const offset = uniform(float(intensity))

    // Calculate direction from center
    const direction = uv.sub(vec2(0.5, 0.5))
    const distance = direction.length()

    // Offset each channel differently
    const r = texture(sceneTexture, uv.add(direction.mul(offset.mul(0.01))))
    const g = texture(sceneTexture, uv)
    const b = texture(sceneTexture, uv.sub(direction.mul(offset.mul(0.01))))

    return vec4(r.r, g.g, b.b, 1.0)
  },
)

/**
 * Advanced chromatic aberration with custom distortion curve
 */
export const chromaticAberrationAdvanced = Fn<{
  sceneTexture: Texture
  intensity?: number
  distortion?: number
}>(({ sceneTexture, intensity = 0.5, distortion = 1.0 }) => {
  const uv = uvNode()
  const offset = uniform(float(intensity))
  const curve = uniform(float(distortion))

  const direction = uv.sub(vec2(0.5, 0.5))
  const distance = direction.length()

  // Apply power curve to distortion
  const distortionFactor = distance.pow(curve)

  const rOffset = direction.mul(offset.mul(0.015).mul(distortionFactor))
  const gOffset = direction.mul(offset.mul(0.005).mul(distortionFactor))
  const bOffset = direction.mul(offset.mul(0.01).mul(distortionFactor).negate())

  const r = texture(sceneTexture, uv.add(rOffset))
  const g = texture(sceneTexture, uv.add(gOffset))
  const b = texture(sceneTexture, uv.add(bOffset))

  return vec4(r.r, g.g, b.b, 1.0)
})

