import {
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
  instanceIndex,
  normalize,
  Discard,
  uv,
  time,
} from 'three/tsl'
import { Vector3 } from 'three'
import { WebGPUPointer } from './pointer'
import { curlNoise4d } from '@/lib/tsl/noise/curl_noise_4d'

export interface FlowFieldConfig {
  count?: number
  spawnPadding?: number
  baseScale?: number
  turbulenceFrequency?: number
  turbulenceAmplitude?: number
  turbulenceOctaves?: number
  turbulenceLacunarity?: number
  turbulenceGain?: number
  turbulenceFriction?: number
  pointerRadius?: number
  pointerAttractionStrength?: number
  hoverPower?: number
  hoverDuration?: number
  wanderingSpeed?: number
  contactScale?: number
}

export interface FlowFieldSystem {
  readonly count: number
  readonly renderer: WebGPURenderer
  readonly buffers: {
    basePositions: ReturnType<typeof storage>
    positions: ReturnType<typeof storage>
    velocities: ReturnType<typeof storage>
    life: ReturnType<typeof storage>
    strength: ReturnType<typeof storage>
  }
  readonly uniforms: FlowFieldUniforms
  init: (basePositions: Float32Array) => Promise<void>
  update: () => Promise<void>
  createMesh: (options?: { geometry?: PlaneGeometry }) => InstancedMesh
  pointer: WebGPUPointer
  dispose: () => void
}

export interface FlowFieldUniforms {
  cursorRadius: ReturnType<typeof float>
  pointerAttractionStrength: ReturnType<typeof float>
  hoverPower: ReturnType<typeof float>
  hoverDuration: ReturnType<typeof float>
  wanderingSpeed: ReturnType<typeof float>
  contactScale: ReturnType<typeof float>
  turbulenceFrequency: ReturnType<typeof float>
  turbulenceAmplitude: ReturnType<typeof float>
  turbulenceOctaves: ReturnType<typeof float>
  turbulenceLacunarity: ReturnType<typeof float>
  turbulenceGain: ReturnType<typeof float>
  turbulenceFriction: ReturnType<typeof float>
}

const defaultConfig: Required<FlowFieldConfig> = {
  count: 10000,
  spawnPadding: 0.5,
  baseScale: 0.3,
  turbulenceFrequency: 0.5,
  turbulenceAmplitude: 0.5,
  turbulenceOctaves: 2,
  turbulenceLacunarity: 2,
  turbulenceGain: 0.5,
  turbulenceFriction: 0.01,
  pointerRadius: 10,
  pointerAttractionStrength: 0.015,
  hoverPower: 1,
  hoverDuration: 1,
  wanderingSpeed: 0.003,
  contactScale: 1,
}

export function createFlowFieldSystem(
  renderer: WebGPURenderer,
  camera: any,
  pointerPlane: any,
  config?: FlowFieldConfig,
): FlowFieldSystem {
  const opts = { ...defaultConfig, ...config }
  const count = opts.count

  const pointer = new WebGPUPointer(renderer, camera, pointerPlane)

  const basePositions = storage(new StorageInstancedBufferAttribute(count, 3).setPBO(true), 'vec3', count)
  const positions = storage(new StorageInstancedBufferAttribute(count, 3), 'vec3', count)
  const velocities = storage(new StorageInstancedBufferAttribute(count, 3), 'vec3', count)
  const life = storage(new StorageInstancedBufferAttribute(count, 1), 'float', count)
  const strength = storage(new StorageInstancedBufferAttribute(count, 1), 'float', count)

  const uniforms: FlowFieldUniforms = {
    cursorRadius: float(opts.pointerRadius),
    pointerAttractionStrength: float(opts.pointerAttractionStrength),
    hoverPower: float(opts.hoverPower),
    hoverDuration: float(opts.hoverDuration),
    wanderingSpeed: float(opts.wanderingSpeed),
    contactScale: float(opts.contactScale),
    turbulenceFrequency: float(opts.turbulenceFrequency),
    turbulenceAmplitude: float(opts.turbulenceAmplitude),
    turbulenceOctaves: float(opts.turbulenceOctaves),
    turbulenceLacunarity: float(opts.turbulenceLacunarity),
    turbulenceGain: float(opts.turbulenceGain),
    turbulenceFriction: float(opts.turbulenceFriction),
  }

  const init = async (basePositionArray: Float32Array) => {
    basePositions.attribute.array = basePositionArray
    positions.attribute.array = basePositionArray.slice(0)

    const initCompute = Fn(() => {
      velocities.element(instanceIndex).assign(vec3(0))
      life.element(instanceIndex).assign(hash(instanceIndex).mul(10))
      strength.element(instanceIndex).assign(0)
    }).compute(count)

    await renderer.computeAsync(initCompute)
    initCompute.dispose()
  }

  const updateCompute = Fn(() => {
    const position = positions.element(instanceIndex)
    const basePosition = basePositions.element(instanceIndex)
    const velocity = velocities.element(instanceIndex)
    const instanceLife = life.element(instanceIndex)
    const strengthValue = strength.element(instanceIndex)

    const flowField = curlNoise4d(vec4(position, time.mul(uniforms.turbulenceFrequency)))
      .mul(uniforms.turbulenceAmplitude)
      .mul(instanceLife.add(0.015))
      .toVar()

    velocity.addAssign(flowField)
    velocity.mulAssign(float(1).sub(uniforms.turbulenceFriction))

    const distanceToCursor = pointer.uPointer.distance(basePosition)
    const cursorStrength = float(uniforms.cursorRadius).sub(distanceToCursor).smoothstep(0, 1)

    strengthValue.assign(strengthValue.add(cursorStrength).sub(deltaTime.mul(uniforms.hoverDuration)).clamp(0, 1))

    const pointerAttractionDirection = normalize(position.sub(pointer.uPointer))
    const pointerAttraction = pointerAttractionDirection.mul(uniforms.pointerAttractionStrength)
    position.subAssign(pointerAttraction)

    const wandering = curlNoise4d(vec4(position, time.mul(uniforms.turbulenceFrequency).add(1)))
      .mul(uniforms.wanderingSpeed)
      .mul(strengthValue.add(0.5))

    position.addAssign(wandering.add(flowField.mul(deltaTime).mul(strengthValue)))
    position.xy.addAssign(velocity.mul(strengthValue).mul(deltaTime).mul(uniforms.hoverPower))

    const distanceDecay = basePosition
      .distance(position)
      .remap(0, 1, float(0.2), float(1))
      .clamp(0, 1)
    const newLife = instanceLife.add(deltaTime.mul(distanceDecay)).toVar()
    If(newLife.greaterThan(1), () => {
      position.assign(basePosition)
    })

    instanceLife.assign(newLife.mod(1))
  }).compute(count)

  const update = async () => {
    await renderer.computeAsync(updateCompute)
  }

  const createMesh: FlowFieldSystem['createMesh'] = ({ geometry } = {}) => {
    const plane = geometry ?? new PlaneGeometry(1, 1)
    const material = new SpriteNodeMaterial({
      depthWrite: false,
      sizeAttenuation: true,
    })

    material.positionNode = positions.element(instanceIndex)

    material.scaleNode = Fn(() => {
      const strengthValue = strength.element(instanceIndex)
      const instanceLife = life.element(instanceIndex)

      const scale = smoothstep(0, 0.1, instanceLife)
        .min(smoothstep(0.7, 1, instanceLife).oneMinus())
        .mul(
          hash(instanceIndex)
            .remap(0.5, 1)
            .mul(float(opts.baseScale).mul(uniforms.contactScale.mul(strengthValue.add(1)))),
        )

      return scale
    })()

    material.colorNode = Fn(() => {
      const strengthValue = strength.element(instanceIndex)
      Discard(distance(uv(), vec2(0.5)).greaterThan(0.5))
      return vec4(hash(instanceIndex).add(strengthValue), hash(instanceIndex.add(1)), hash(instanceIndex.add(2)), 1)
    })()

    const mesh = new InstancedMesh(plane, material, count)
    mesh.frustumCulled = false
    return mesh
  }

  const dispose = () => {
    pointer.destroy()
    updateCompute.dispose()
    positions.dispose?.()
    velocities.dispose?.()
    life.dispose?.()
    basePositions.dispose?.()
    strength.dispose?.()
  }

  return {
    count,
    renderer,
    buffers: {
      basePositions,
      positions,
      velocities,
      life,
      strength,
    },
    uniforms,
    pointer,
    init,
    update,
    createMesh,
    dispose,
  }
}

