/**
 * Refraction & Glass Effects for TSL/WebGPU
 * Advanced chromatic refraction with absorption and fresnel
 * @module tsl/effects/refraction
 */

import {
  Fn,
  abs,
  dot,
  float,
  max,
  mix,
  normalize,
  normalWorld,
  positionWorld,
  pow,
  rand,
  sub,
  texture,
  vec3,
  viewportUV,
} from 'three/tsl'
import type { Texture, ShaderNodeObject, Node } from 'three/webgpu'

/**
 * Classic Fresnel calculation
 * Returns fresnel factor based on view angle
 */
export const classicFresnel = Fn<{
  viewVector: ShaderNodeObject<Node>
  worldNormal: ShaderNodeObject<Node>
  power: number
}>(({ viewVector, worldNormal, power }) => {
  const cosTheta = abs(dot(viewVector, worldNormal))
  const inverseFresnelFactor = sub(1.0, cosTheta)
  return pow(inverseFresnelFactor, power)
})

/**
 * Saturation adjustment
 */
export const saturate = Fn<[ShaderNodeObject<Node>]>(([col]) => {
  const W = vec3(0.2125, 0.7154, 0.0721)
  const intensity = vec3(dot(col, W))
  return mix(intensity, col, 1.265)
})

/**
 * Advanced refraction with chromatic aberration
 * Simulates light passing through glass with color separation
 */
export const chromaticRefraction = Fn<{
  sceneTexture: Texture
  cameraPosition: ShaderNodeObject<Node>
  lightPosition?: ShaderNodeObject<Node>
  absorption?: number
  refractionIntensity?: number
  shininess?: number
  loops?: number
  noiseIntensity?: number
}>(
  ({
    sceneTexture,
    cameraPosition,
    lightPosition = vec3(10, 10, 10),
    absorption = 0.1,
    refractionIntensity = 0.25,
    shininess = 100.0,
    loops = 8,
    noiseIntensity = 0.015,
  }) => {
    // Calculate refraction normal from world normal
    const refractNormal = normalWorld.xy
      .mul(sub(1.0, normalWorld.z.mul(0.85)))
      .add(0.05)

    const refractCol = vec3(0.0, 0.0, 0.0).toVar()

    // Multi-pass refraction with chromatic aberration
    for (let i = 0; i < loops; i++) {
      const noise = rand(viewportUV).mul(noiseIntensity)
      const slide = float(i).div(float(loops)).mul(0.18).add(noise)

      // Different offset per color channel
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

    refractCol.assign(refractCol.div(float(loops)))

    // Add specular highlights
    const lightVector = normalize(vec3(lightPosition))
    const viewVector = normalize(cameraPosition.sub(positionWorld))
    const normalVector = normalize(normalWorld)

    const halfVector = normalize(viewVector.add(lightVector))

    const NdotL = dot(normalVector, lightVector)
    const NdotH = dot(normalVector, halfVector)

    const kDiffuse = max(0.0, NdotL)
    const NdotH2 = NdotH.mul(NdotH)
    const kSpecular = pow(NdotH2, shininess)

    // Fresnel effect
    const fresnel = classicFresnel({
      viewVector: viewVector,
      worldNormal: normalVector,
      power: 5.0,
    })

    refractCol.assign(
      refractCol.add(kSpecular.add(kDiffuse).mul(0.01).add(fresnel)),
    )

    return saturate(refractCol)
  },
)

/**
 * Simple glass material effect
 * Lighter version for performance
 */
export const simpleGlass = Fn<{
  sceneTexture: Texture
  cameraPosition: ShaderNodeObject<Node>
  refractionStrength?: number
  fresnelPower?: number
}>(
  ({
    sceneTexture,
    cameraPosition,
    refractionStrength = 0.1,
    fresnelPower = 3.0,
  }) => {
    const viewVector = normalize(cameraPosition.sub(positionWorld))
    const normalVector = normalize(normalWorld)

    // Simple refraction offset
    const refractOffset = normalVector.xy.mul(refractionStrength)
    const refractUV = viewportUV.sub(refractOffset)

    const refractedColor = texture(sceneTexture, refractUV).rgb

    // Fresnel for rim effect
    const fresnel = classicFresnel({
      viewVector: viewVector,
      worldNormal: normalVector,
      power: fresnelPower,
    })

    // Mix refraction with fresnel rim
    const finalColor = refractedColor.add(fresnel.mul(0.2))

    return vec3(finalColor)
  },
)

/**
 * Dispersion effect (rainbow glass)
 * Separates colors based on IOR differences
 */
export const dispersionEffect = Fn<{
  sceneTexture: Texture
  dispersionStrength?: number
  iorR?: number
  iorG?: number
  iorB?: number
}>(
  ({
    sceneTexture,
    dispersionStrength = 0.05,
    iorR = 1.5,
    iorG = 1.52,
    iorB = 1.54,
  }) => {
    const normal = normalize(normalWorld)

    // Different IOR per channel creates dispersion
    const offsetR = normal.xy.mul(dispersionStrength).mul(iorR)
    const offsetG = normal.xy.mul(dispersionStrength).mul(iorG)
    const offsetB = normal.xy.mul(dispersionStrength).mul(iorB)

    const r = texture(sceneTexture, viewportUV.sub(offsetR)).r
    const g = texture(sceneTexture, viewportUV.sub(offsetG)).g
    const b = texture(sceneTexture, viewportUV.sub(offsetB)).b

    return vec3(r, g, b)
  },
)

