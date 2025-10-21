'use client'

import {
  InstancedMesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  StorageInstancedBufferAttribute,
  type WebGPURenderer,
} from 'three/webgpu'
import { Color, Vector3 } from 'three'
import {
  Fn,
  abs,
  add,
  clamp,
  deltaTime,
  float,
  hash,
  instanceIndex,
  length,
  mix,
  normalize,
  sin,
  storage,
  time,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'

import { WebGPUPointer } from './pointer'

export interface MorphParticleConfig {
  count?: number
  attractionStrength?: number
  noiseAmplitude?: number
  noiseFrequency?: number
  damping?: number
  pointerStrength?: number
  baseSize?: number
  colorA?: string
  colorB?: string
}

export interface MorphParticleSystem {
  readonly count: number
  readonly renderer: WebGPURenderer
  readonly pointer: WebGPUPointer
  readonly buffers: {
    positions: ReturnType<typeof storage>
    velocities: ReturnType<typeof storage>
    targets: ReturnType<typeof storage>
    palette: ReturnType<typeof storage>
  }
  readonly uniforms: MorphUniforms
  init: (initialPositions: Float32Array, initialTargets: Float32Array) => Promise<void>
  setTargets: (nextTargets: Float32Array) => Promise<void>
  update: () => Promise<void>
  createMesh: (options?: { additive?: boolean }) => InstancedMesh
  dispose: () => void
}

export interface MorphUniforms {
  attractionStrength: ReturnType<typeof float>
  noiseAmplitude: ReturnType<typeof float>
  noiseFrequency: ReturnType<typeof float>
  damping: ReturnType<typeof float>
  pointerStrength: ReturnType<typeof float>
  pointerPosition: ReturnType<typeof vec3>
  pointerVelocity: ReturnType<typeof vec3>
  timeScale: ReturnType<typeof float>
}

const defaultConfig: Required<MorphParticleConfig> = {
  count: 12000,
  attractionStrength: 4.5,
  noiseAmplitude: 0.45,
  noiseFrequency: 0.6,
  damping: 0.89,
  pointerStrength: 1.25,
  baseSize: 0.035,
  colorA: '#38bdf8',
  colorB: '#f472b6',
}

export function createMorphParticleSystem(
  renderer: WebGPURenderer,
  camera: any,
  pointerPlane: any,
  config?: MorphParticleConfig,
): MorphParticleSystem {
  const opts = { ...defaultConfig, ...config }
  const count = opts.count

  const pointer = new WebGPUPointer(renderer, camera, pointerPlane)

  const positions = storage(
    new StorageInstancedBufferAttribute(count, 3).setPBO(true),
    'vec3',
    count,
  )
  const velocities = storage(new StorageInstancedBufferAttribute(count, 3), 'vec3', count)
  const targets = storage(
    new StorageInstancedBufferAttribute(count, 3).setPBO(true),
    'vec3',
    count,
  )

  const palette = storage(new StorageInstancedBufferAttribute(count, 3), 'vec3', count)

  const uniforms: MorphUniforms = {
    attractionStrength: float(opts.attractionStrength),
    noiseAmplitude: float(opts.noiseAmplitude),
    noiseFrequency: float(opts.noiseFrequency),
    damping: float(opts.damping),
    pointerStrength: float(opts.pointerStrength),
    pointerPosition: vec3(new Vector3()),
    pointerVelocity: vec3(new Vector3()),
    timeScale: float(1),
  }

  const baseColor = new Color(opts.colorA)
  const accentColor = new Color(opts.colorB)

  const initCompute = Fn(() => {
    const id = float(instanceIndex)
    const randomOffset = hash(vec4(id.mul(13.7), id.mul(17.9), id.mul(0.27), time.mul(0.1)))

    const t = hash(vec2(id, time.mul(0.5)))
    const paletteColor = mix(
      vec3(baseColor.r, baseColor.g, baseColor.b),
      vec3(accentColor.r, accentColor.g, accentColor.b),
      t,
    )

    positions.element(instanceIndex).assign(vec3(randomOffset, t, randomOffset.sub(t)))
    velocities.element(instanceIndex).assign(vec3(0))
    palette.element(instanceIndex).assign(paletteColor)
  }).compute(count)

  const updateCompute = Fn(() => {
    const pos = positions.element(instanceIndex)
    const vel = velocities.element(instanceIndex)
    const target = targets.element(instanceIndex)

    const toTarget = target.sub(pos).toVar('toTarget')
    const distance = length(toTarget).toVar('distance')
    const direction = normalize(toTarget.add(vec3(1e-5)))

    const attraction = direction
      .mul(uniforms.attractionStrength)
      .mul(distance.clamp(0, 1))

    vel.addAssign(attraction.mul(deltaTime))

    const noiseSeed = vec3(
      instanceIndex.mul(0.17),
      time.mul(uniforms.noiseFrequency),
      target.x.add(target.y),
    )

    const wander = hash(noiseSeed)
      .sub(0.5)
      .mul(uniforms.noiseAmplitude)

    vel.addAssign(wander)

    const pointerDelta = pos.sub(uniforms.pointerPosition)
    const pointerDistance = length(pointerDelta).add(0.0001)
    const pointerForce = pointerDelta
      .normalize()
      .mul(uniforms.pointerStrength)
      .div(pointerDistance.mul(pointerDistance))

    vel.addAssign(pointerForce)
    vel.addAssign(uniforms.pointerVelocity.mul(0.1))

    vel.mulAssign(uniforms.damping)
    pos.addAssign(vel.mul(deltaTime.mul(uniforms.timeScale)))
  }).compute(count)

  const resources: {
    mesh?: InstancedMesh
  } = {}

  const init = async (initialPositions: Float32Array, initialTargets: Float32Array) => {
    if (initialPositions.length !== count * 3) {
      throw new Error(`initialPositions must contain ${count * 3} values`)
    }
    if (initialTargets.length !== count * 3) {
      throw new Error(`initialTargets must contain ${count * 3} values`)
    }

    positions.attribute.array = initialPositions
    targets.attribute.array = initialTargets

    await renderer.computeAsync(initCompute)
  }

  const setTargets = async (nextTargets: Float32Array) => {
    if (nextTargets.length !== count * 3) {
      throw new Error(`nextTargets must contain ${count * 3} values`)
    }

    targets.attribute.array = nextTargets
    // ensure compute shader picks up latest values by resetting velocities
    await renderer.computeAsync(
      Fn(() => {
        velocities.element(instanceIndex).assign(vec3(0))
      }).compute(count),
    )
  }

  const update = async () => {
    uniforms.pointerPosition.value.copy(pointer.uPointer.value)
    uniforms.pointerVelocity.value.copy(pointer.uPointerVelocity.value)
    await renderer.computeAsync(updateCompute)
  }

  const createMesh: MorphParticleSystem['createMesh'] = ({ additive } = {}) => {
    if (resources.mesh) return resources.mesh

    const geometry = new PlaneGeometry(1, 1)
    const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })

    material.positionNode = positions.element(instanceIndex)
    material.scaleNode = float(opts.baseSize)
      .mul(hash(instanceIndex.mul(0.37)).mul(0.6).add(0.7))
      .mul(add(vec3(1), abs(velocities.element(instanceIndex))))

    material.colorNode = palette.element(instanceIndex)

    const mesh = new InstancedMesh(geometry, material, count)
    mesh.frustumCulled = false
    resources.mesh = mesh

    return mesh
  }

  const dispose = () => {
    pointer.destroy()
    initCompute.dispose()
    updateCompute.dispose()
    positions.dispose?.()
    velocities.dispose?.()
    targets.dispose?.()
    palette.dispose?.()

    if (resources.mesh) {
      resources.mesh.geometry.dispose()
      ;(resources.mesh.material as MeshBasicNodeMaterial).dispose()
    }
  }

  return {
    count,
    renderer,
    pointer,
    buffers: {
      positions,
      velocities,
      targets,
      palette,
    },
    uniforms,
    init,
    setTargets,
    update,
    createMesh,
    dispose,
  }
}


