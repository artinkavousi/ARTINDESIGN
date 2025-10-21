'use client'

import {
  InstancedMesh,
  MeshPhysicalNodeMaterial,
  PlaneGeometry,
  StorageInstancedBufferAttribute,
  type WebGPURenderer,
} from 'three/webgpu'
import { DoubleSide, Vector2 } from 'three'
import {
  Fn,
  abs,
  dot,
  exp,
  float,
  hash,
  instanceIndex,
  mix,
  normalize,
  positionLocal,
  smoothstep,
  storage,
  time,
  vec2,
  vec3,
} from 'three/tsl'

export interface FluidSurfaceConfig {
  /** Grid resolution (number of cells per side). Higher values increase quality and cost. */
  resolution?: number
  /** Length of the simulated surface in world units. */
  worldSize?: number
  /** Vertical displacement multiplier for the water surface. */
  heightScale?: number
  /** Wave propagation speed coefficient. */
  waveSpeed?: number
  /** Velocity damping applied each step. */
  damping?: number
  /** Pointer influence radius in normalized [0, 1] coordinates. */
  pointerRadius?: number
  /** Decay applied to pointer impulses every update. */
  pointerDecay?: number
  /** Maximum integration timestep (seconds). */
  maxTimeStep?: number
  /** Ambient jitter applied every frame to keep the surface alive. */
  ambientJitter?: number
  /** Slow drift multiplier for ambient jitter. */
  baseDrift?: number
  /** Maximum accumulated pointer intensity to avoid instability. */
  maxPointerIntensity?: number
}

export interface FluidSurfaceSimulation {
  readonly resolution: number
  readonly renderer: WebGPURenderer
  readonly buffers: {
    heights: ReturnType<typeof storage>
    previousHeights: ReturnType<typeof storage>
    velocity: ReturnType<typeof storage>
    normals: ReturnType<typeof storage>
  }
  readonly uniforms: FluidSurfaceUniforms
  init: () => Promise<void>
  update: (delta: number) => Promise<void>
  setPointer: (u: number, v: number, strength?: number) => void
  addDrop: (u: number, v: number, strength: number) => void
  createMesh: (options?: { doubleSided?: boolean }) => InstancedMesh
  dispose: () => void
}

export interface FluidSurfaceUniforms {
  gridSize: ReturnType<typeof float>
  worldSize: ReturnType<typeof float>
  heightScale: ReturnType<typeof float>
  waveSpeed: ReturnType<typeof float>
  damping: ReturnType<typeof float>
  pointerRadius: ReturnType<typeof float>
  pointerIntensity: ReturnType<typeof float>
  pointerPosition: ReturnType<typeof vec2>
  timeStep: ReturnType<typeof float>
  ambientJitter: ReturnType<typeof float>
  baseDrift: ReturnType<typeof float>
}

type SimInternalResources = {
  mesh?: InstancedMesh
  geometry?: PlaneGeometry
  material?: MeshPhysicalNodeMaterial
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function createFluidSurfaceSimulation(
  renderer: WebGPURenderer,
  config?: FluidSurfaceConfig,
): FluidSurfaceSimulation {
  const resolution = Math.max(8, config?.resolution ?? 128)
  const worldSize = config?.worldSize ?? 6
  const heightScale = config?.heightScale ?? 0.65
  const damping = config?.damping ?? 0.985
  const waveSpeed = config?.waveSpeed ?? 0.28
  const pointerRadius = Math.max(0.01, config?.pointerRadius ?? 0.08)
  const pointerDecay = config?.pointerDecay ?? 0.9
  const maxPointerIntensity = config?.maxPointerIntensity ?? 4
  const ambientJitter = config?.ambientJitter ?? 0.0015
  const baseDrift = config?.baseDrift ?? 0.35
  const maxTimeStep = config?.maxTimeStep ?? 1 / 24

  const count = resolution * resolution

  const heights = storage(
    new StorageInstancedBufferAttribute(count, 1).setPBO(true),
    'float',
    count,
  )

  const previousHeights = storage(
    new StorageInstancedBufferAttribute(count, 1).setPBO(true),
    'float',
    count,
  )

  const velocity = storage(new StorageInstancedBufferAttribute(count, 1), 'float', count)
  const normals = storage(new StorageInstancedBufferAttribute(count, 3), 'vec3', count)

  const pointerPositionValue = new Vector2(0.5, 0.5)
  let pointerIntensityValue = 0
  let pendingUpdate = false

  const uniforms: FluidSurfaceUniforms = {
    gridSize: float(resolution),
    worldSize: float(worldSize),
    heightScale: float(heightScale),
    waveSpeed: float(waveSpeed),
    damping: float(damping),
    pointerRadius: float(1 / (pointerRadius * pointerRadius)),
    pointerIntensity: float(0),
    pointerPosition: vec2(pointerPositionValue),
    timeStep: float(1 / 60),
    ambientJitter: float(ambientJitter),
    baseDrift: float(baseDrift),
  }

  const clearCompute = Fn(() => {
    heights.element(instanceIndex).assign(0)
    previousHeights.element(instanceIndex).assign(0)
    velocity.element(instanceIndex).assign(0)
    normals.element(instanceIndex).assign(vec3(0, 1, 0))
  }).compute(count)

  const stepCompute = Fn(() => {
    const size = uniforms.gridSize
    const idxFloat = float(instanceIndex)

    const x = idxFloat.mod(size)
    const y = idxFloat.div(size).floor()
    const sizeMinusOne = size.sub(1)

    const leftX = x.sub(1).clamp(0, sizeMinusOne)
    const rightX = x.add(1).clamp(0, sizeMinusOne)
    const upY = y.sub(1).clamp(0, sizeMinusOne)
    const downY = y.add(1).clamp(0, sizeMinusOne)

    const leftIndex = leftX.add(y.mul(size))
    const rightIndex = rightX.add(y.mul(size))
    const upIndex = x.add(upY.mul(size))
    const downIndex = x.add(downY.mul(size))

    const center = heights.element(instanceIndex)
    const left = heights.element(leftIndex)
    const right = heights.element(rightIndex)
    const up = heights.element(upIndex)
    const down = heights.element(downIndex)

    const laplacian = left.add(right).add(up).add(down).sub(center.mul(4))

    const currentVelocity = velocity.element(instanceIndex)
    currentVelocity.addAssign(laplacian.mul(uniforms.waveSpeed).mul(uniforms.timeStep))

    const gridInv = sizeMinusOne.max(float(1)).oneOver()
    const uv = vec2(x.mul(gridInv), y.mul(gridInv))
    const pointerDelta = uv.sub(uniforms.pointerPosition)
    const pointerDistanceSq = dot(pointerDelta, pointerDelta)
    const pointerFalloff = exp(pointerDistanceSq.mul(uniforms.pointerRadius).mul(-1))
    currentVelocity.addAssign(uniforms.pointerIntensity.mul(pointerFalloff))

    const jitterSeed = vec3(x.mul(13.37), y.mul(17.48), time.mul(uniforms.baseDrift))
    const jitter = hash(jitterSeed).sub(0.5).mul(uniforms.ambientJitter)
    currentVelocity.addAssign(jitter)

    currentVelocity.mulAssign(uniforms.damping)

    const newHeight = center.add(currentVelocity)

    previousHeights.element(instanceIndex).assign(center)
    heights.element(instanceIndex).assign(newHeight)
    velocity.element(instanceIndex).assign(currentVelocity)

    const gradientX = right.sub(left)
    const gradientZ = down.sub(up)
    const normal = vec3(
      gradientX.mul(uniforms.heightScale).mul(-1),
      float(1),
      gradientZ.mul(uniforms.heightScale).mul(-1),
    ).normalize()

    normals.element(instanceIndex).assign(normal)
  }).compute(count)

  const resources: SimInternalResources = {}

  const init = async () => {
    await renderer.computeAsync(clearCompute)
    pointerIntensityValue = 0
    uniforms.pointerIntensity.value = 0
  }

  const update = async (delta: number) => {
    if (pendingUpdate) return
    pendingUpdate = true

    const clampedDelta = Math.min(delta, maxTimeStep)
    uniforms.timeStep.value = clampedDelta

    pointerIntensityValue *= pointerDecay
    if (pointerIntensityValue < 1e-3) {
      pointerIntensityValue = 0
    }
    uniforms.pointerIntensity.value = pointerIntensityValue

    await renderer.computeAsync(stepCompute)
    pendingUpdate = false
  }

  const setPointer = (u: number, v: number, strength = 0.5) => {
    pointerPositionValue.set(clamp01(u), clamp01(v))
    pointerIntensityValue = Math.min(maxPointerIntensity, pointerIntensityValue + Math.max(0, strength))
    uniforms.pointerIntensity.value = pointerIntensityValue
  }

  const addDrop = (u: number, v: number, strength: number) => {
    setPointer(u, v, strength)
  }

  const createMesh = ({ doubleSided = true }: { doubleSided?: boolean } = {}) => {
    if (resources.mesh) {
      return resources.mesh
    }

    const geometry = new PlaneGeometry(1, 1, 1, 1)
    const material = new MeshPhysicalNodeMaterial({
      roughness: 0.2,
      metalness: 0,
      transmission: 0.65,
      thickness: 0.45,
      transparent: true,
      envMapIntensity: 0.9,
      ior: 1.33,
    })

    material.side = doubleSided ? DoubleSide : material.side
    material.clearcoat = 0.35
    material.clearcoatRoughness = 0.15

    material.positionNode = Fn(() => {
      const size = uniforms.gridSize
      const idxFloatLocal = float(instanceIndex)
      const x = idxFloatLocal.mod(size)
      const y = idxFloatLocal.div(size).floor()
      const sizeMinusOne = size.sub(1)
      const gridInv = sizeMinusOne.max(float(1)).oneOver()

      const uv = vec2(x.mul(gridInv), y.mul(gridInv))
      const height = heights.element(instanceIndex).mul(uniforms.heightScale)

      const center = vec3(
        uv.x.sub(0.5).mul(uniforms.worldSize),
        height,
        uv.y.sub(0.5).mul(uniforms.worldSize),
      )

      const cellSize = uniforms.worldSize.div(size)
      const scaledLocal = positionLocal.mul(vec3(cellSize, uniforms.heightScale, cellSize))

      return center.add(scaledLocal)
    })()

    material.normalNode = Fn(() => normals.element(instanceIndex))()

    material.colorNode = Fn(() => {
      const energy = velocity.element(instanceIndex).abs().mul(6).clamp(0, 1)
      const deepWater = vec3(0.05, 0.2, 0.36)
      const foam = vec3(0.78, 0.93, 1.0)
      return mix(deepWater, foam, energy)
    })()

    const mesh = new InstancedMesh(geometry, material, count)
    mesh.frustumCulled = false

    resources.mesh = mesh
    resources.geometry = geometry
    resources.material = material

    return mesh
  }

  const dispose = () => {
    clearCompute.dispose()
    stepCompute.dispose()
    heights.dispose?.()
    previousHeights.dispose?.()
    velocity.dispose?.()
    normals.dispose?.()

    if (resources.mesh) {
      resources.mesh.instanceMatrix?.dispose?.()
      resources.mesh.geometry.dispose()
      ;(resources.mesh.material as MeshPhysicalNodeMaterial)?.dispose()
    }

    resources.mesh = undefined
    resources.geometry = undefined
    resources.material = undefined
  }

  return {
    resolution,
    renderer,
    buffers: {
      heights,
      previousHeights,
      velocity,
      normals,
    },
    uniforms,
    init,
    update,
    setPointer,
    addDrop,
    createMesh,
    dispose,
  }
}


