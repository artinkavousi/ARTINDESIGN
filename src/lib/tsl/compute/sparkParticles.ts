import {
  AdditiveBlending,
  InstancedMesh,
  PlaneGeometry,
  SpriteNodeMaterial,
  StorageInstancedBufferAttribute,
  type WebGPURenderer,
} from 'three/webgpu'
import {
  Fn,
  If,
  smoothstep,
  storage,
  vec2,
  vec3,
  vec4,
  float,
  hash,
  deltaTime,
  distance,
  instanceIndex,
  normalize,
  Discard,
  uv,
} from 'three/tsl'
import { Vector3, Color } from 'three'

export interface SparkParticleConfig {
  /** Number of particles to simulate */
  count?: number
  /** Maximum number of particles spawned per frame */
  spawnCount?: number
  /** Base launch speed multiplier */
  sparkSpeed?: number
  /** Spread multiplier for randomised direction */
  sparkSpread?: number
  /** Gravity strength applied every frame */
  gravity?: number
  /** How quickly spark lifetime decays (seconds) */
  sparkLifeDecay?: number
  /** Fading radius for pointer influence */
  pointerRadius?: number
  /** Base particle size in world units */
  baseParticleSize?: number
  /** Optional color ramp override */
  color?: Color
}

export interface SparkParticleUniforms {
  spawnCount: ReturnType<typeof float>
  sparkSpeed: ReturnType<typeof float>
  sparkSpread: ReturnType<typeof float>
  sparkLifeDecay: ReturnType<typeof float>
  gravity: ReturnType<typeof float>
  pointerRadius: ReturnType<typeof float>
  pointerPosition: ReturnType<typeof vec3>
  pointerVelocity: ReturnType<typeof vec3>
}

export interface SparkParticleBuffers {
  positions: ReturnType<typeof storage>
  velocities: ReturnType<typeof storage>
  life: ReturnType<typeof storage>
}

export interface SparkParticleSystem {
  readonly count: number
  readonly renderer: WebGPURenderer
  readonly buffers: SparkParticleBuffers
  readonly uniforms: SparkParticleUniforms
  /** Initialises particle buffers */
  init: () => Promise<void>
  /** Advances compute step */
  update: () => Promise<void>
  /** Updates pointer position */
  setPointerPosition: (value: Vector3) => void
  /** Updates pointer velocity */
  setPointerVelocity: (value: Vector3) => void
  /** Creates a ready-to-use instanced mesh bound to the particle buffers */
  createMesh: (options?: { geometry?: PlaneGeometry; additive?: boolean }) => InstancedMesh
  /** Disposes all GPU resources */
  dispose: () => void
}

const defaultConfig: Required<Omit<SparkParticleConfig, 'color'>> = {
  count: 20000,
  spawnCount: 20000,
  sparkSpeed: 2,
  sparkSpread: 1,
  gravity: 2,
  sparkLifeDecay: 1,
  pointerRadius: 1.2,
  baseParticleSize: 0.05,
}

export function createSparkParticleSystem(
  renderer: WebGPURenderer,
  config?: SparkParticleConfig,
): SparkParticleSystem {
  const opts = { ...defaultConfig, ...config }
  const count = opts.count

  const pointerPositionValue = new Vector3()
  const pointerVelocityValue = new Vector3()

  const positions = storage(
    new StorageInstancedBufferAttribute(count, 3).setPBO(true),
    'vec3',
    count,
  )

  const velocities = storage(new StorageInstancedBufferAttribute(count, 3), 'vec3', count)

  const life = storage(new StorageInstancedBufferAttribute(count, 1), 'float', count)

  const uniforms: SparkParticleUniforms = {
    spawnCount: float(opts.spawnCount),
    sparkSpeed: float(opts.sparkSpeed),
    sparkSpread: float(opts.sparkSpread),
    sparkLifeDecay: float(opts.sparkLifeDecay),
    gravity: float(opts.gravity),
    pointerRadius: float(opts.pointerRadius),
    pointerPosition: vec3(pointerPositionValue),
    pointerVelocity: vec3(pointerVelocityValue),
  }

  const initCompute = Fn(() => {
    positions.element(instanceIndex).assign(vec3(0))
    velocities.element(instanceIndex).assign(vec3(0))
    life.element(instanceIndex).assign(0)
  }).compute(count)

  const updateCompute = Fn(() => {
    const position = positions.element(instanceIndex)
    const velocity = velocities.element(instanceIndex)
    const currentLife = life.element(instanceIndex)

    position.addAssign(velocity.mul(deltaTime))
    currentLife.subAssign(deltaTime.mul(uniforms.sparkLifeDecay))

    const pointerVector = uniforms.pointerPosition.sub(position).toVar('pointerDelta')
    const pointerDistance = pointerVector.length().toVar('pointerDistance')
    const pointerStrength = smoothstep(uniforms.pointerRadius, float(0), pointerDistance)
      .mul(uniforms.sparkSpread)
      .toVar()

    If(currentLife.lessThan(0), () => {
      const randomDir = normalize(
        vec3(
          hash(instanceIndex.mul(deltaTime.add(1))),
          hash(instanceIndex.mul(deltaTime.add(2))),
          hash(instanceIndex.mul(deltaTime.add(3))),
        ).sub(0.5),
      )

      If(float(instanceIndex).lessThan(uniforms.spawnCount), () => {
        position.assign(uniforms.pointerPosition)
        velocity.assign(
          randomDir
            .mul(uniforms.sparkSpeed)
            .add(uniforms.pointerVelocity)
            .mul(pointerStrength.add(1)),
        )
        currentLife.assign(hash(instanceIndex.add(deltaTime)).mul(1.2).add(0.5))
      }).Else(() => {
        position.assign(vec3(0))
        velocity.assign(vec3(0))
        currentLife.assign(0)
      })
    }).Else(() => {
      velocity.y.subAssign(deltaTime.mul(uniforms.gravity))
      velocity.mulAssign(0.98)
    })
  }).compute(count)

  const init = async () => {
    await renderer.computeAsync(initCompute)
  }

  const update = async () => {
    await renderer.computeAsync(updateCompute)
  }

  const createMesh: SparkParticleSystem['createMesh'] = ({ geometry, additive } = {}) => {
    const plane = geometry ?? new PlaneGeometry(1, 1)
    const material = new SpriteNodeMaterial({
      depthWrite: false,
      transparent: true,
      sizeAttenuation: true,
      blending: additive ? AdditiveBlending : undefined,
    })

    material.positionNode = positions.toAttribute()

    material.scaleNode = float(hash(instanceIndex).mul(0.8).add(0.2)).mul(opts.baseParticleSize)

    const baseColor = (config?.color ?? new Color('#ff8f5f')).clone()

    material.colorNode = Fn(() => {
      Discard(distance(uv(), vec2(0.5)).greaterThan(0.5))
      const alpha = smoothstep(0, 0.35, life.element(instanceIndex))
      return vec4(baseColor.r, baseColor.g, baseColor.b, alpha)
    })()

    return new InstancedMesh(plane, material, count)
  }

  const dispose = () => {
    initCompute.dispose()
    updateCompute.dispose()
    positions.dispose?.()
    velocities.dispose?.()
    life.dispose?.()
  }

  return {
    count,
    renderer,
    buffers: { positions, velocities, life },
    uniforms,
    init,
    update,
    setPointerPosition: (value) => pointerPositionValue.copy(value),
    setPointerVelocity: (value) => pointerVelocityValue.copy(value),
    createMesh,
    dispose,
  }
}


