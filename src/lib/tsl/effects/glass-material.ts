/**
 * Complete Glass Material System for TSL/WebGPU
 * Production-ready glass shader with all features
 * @module tsl/effects/glass-material
 */

import {
  Fn,
  abs,
  add,
  cross,
  dot,
  float,
  If,
  mix,
  negate,
  normalize,
  normalLocal,
  positionLocal,
  positionWorld,
  texture,
  transformNormalToView,
  uniform,
  varying,
  vec3,
  viewportUV,
} from 'three/tsl'
import type { Texture } from 'three'
import { cnoise } from '../noise/classicNoise3d'

/**
 * Calculate orthogonal tangent for proper normal recalculation
 */
const orthogonal = Fn(() => {
  const pos = normalLocal
  If(abs(pos.x).greaterThan(abs(pos.z)), () => {
    return normalize(vec3(negate(pos.y), pos.x, 0.0))
  })
  return normalize(vec3(0.0, negate(pos.z), pos.y))
})

/**
 * Complete glass material with animated displacement and refraction
 */
export const createGlassMaterial = Fn<{
  sceneTexture: Texture
  cameraPosition: any
  lightPosition?: any
  time: number
  displacementAmount?: number
  refractionIntensity?: number
  absorption?: number
}>(
  ({
    sceneTexture,
    cameraPosition,
    lightPosition = [10, 10, 10],
    time,
    displacementAmount = 0.15,
    refractionIntensity = 0.25,
    absorption = 0.1,
  }) => {
    const vNormal = varying(vec3(), 'vNormal')

    /**
     * Position node with displacement
     */
    const updatePos = Fn(([pos, time]) => {
      const noise = cnoise(vec3(pos).add(vec3(time.mul(1.1)))).mul(
        displacementAmount,
      )
      return add(pos, noise)
    })

    const positionNode = Fn(() => {
      const pos = positionLocal

      const updatedPos = updatePos(pos, time)
      const theta = float(0.001) // Epsilon for normal calculation

      const vecTangent = orthogonal()
      const vecBiTangent = normalize(cross(normalLocal, vecTangent))

      const neighbour1 = pos.add(vecTangent.mul(theta))
      const neighbour2 = pos.add(vecBiTangent.mul(theta))

      const displacedNeighbour1 = updatePos(neighbour1, time)
      const displacedNeighbour2 = updatePos(neighbour2, time)

      const displacedTangent = displacedNeighbour1.sub(updatedPos)
      const displacedBitangent = displacedNeighbour2.sub(updatedPos)

      const normal = normalize(cross(displacedTangent, displacedBitangent))

      const displacedNormal = normal
        .dot(normalLocal)
        .lessThan(0.0)
        .select(normal.negate(), normal)
      vNormal.assign(displacedNormal)

      return updatedPos
    })()

    /**
     * Normal node using recalculated normal
     */
    const normalNode = Fn(() => {
      const normal = vNormal
      return transformNormalToView(normal)
    })()

    /**
     * Color node with refraction
     */
    const colorNode = Fn(() => {
      const LOOP = 8
      const noiseIntensity = 0.015

      const refractNormal = normalWorld.xy
        .mul(sub(1.0, normalWorld.z.mul(0.85)))
        .add(0.05)

      const refractCol = vec3(0.0, 0.0, 0.0).toVar()

      for (let i = 0; i < LOOP; i++) {
        const noise = rand(viewportUV).mul(noiseIntensity)
        const slide = float(i).div(float(LOOP)).mul(0.18).add(noise)

        const refractUvR = viewportUV.sub(
          refractNormal
            .mul(slide.mul(1.0).add(refractionIntensity))
            .mul(absorption),
        )
        const refractUvG = viewportUV.sub(
          refractNormal
            .mul(slide.mul(2.5).add(refractionIntensity))
            .mul(absorption),
        )
        const refractUvB = viewportUV.sub(
          refractNormal
            .mul(slide.mul(4.0).add(refractionIntensity))
            .mul(absorption),
        )

        const red = texture(sceneTexture, refractUvR).r
        const green = texture(sceneTexture, refractUvG).g
        const blue = texture(sceneTexture, refractUvB).b

        refractCol.assign(refractCol.add(vec3(red, green, blue)))
      }

      refractCol.assign(refractCol.div(float(LOOP)))

      // Lighting
      const lightVector = vec3(
        lightPosition[0],
        lightPosition[1],
        lightPosition[2],
      )
      const viewVector = normalize(cameraPosition.sub(positionWorld))
      const normalVector = normalize(normalWorld)

      const halfVector = normalize(viewVector.add(lightVector))

      const NdotL = dot(normalVector, lightVector)
      const NdotH = dot(normalVector, halfVector)

      const kDiffuse = max(0.0, NdotL)
      const NdotH2 = NdotH.mul(NdotH)
      const kSpecular = pow(NdotH2, 100.0)

      // Fresnel
      const cosTheta = abs(dot(viewVector, normalVector))
      const fresnelFactor = sub(1.0, cosTheta)
      const fresnel = pow(fresnelFactor, 5.0)

      refractCol.assign(
        refractCol.add(kSpecular.add(kDiffuse).mul(0.01).add(fresnel)),
      )

      // Saturation
      const W = vec3(0.2125, 0.7154, 0.0721)
      const intensity = vec3(dot(refractCol, W))
      const saturated = mix(intensity, refractCol, 1.265)

      return vec3(saturated)
    })()

    return {
      positionNode,
      normalNode,
      colorNode,
    }
  },
)

