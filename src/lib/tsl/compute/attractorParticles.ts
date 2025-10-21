/**
 * N-Body Attractor Particle System using WebGPU Compute Shaders
 * Implements gravitational/magnetic attraction between particles and fixed attractors
 * @module tsl/compute/attractor-particles
 */

import {
  InstancedMesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  StorageInstancedBufferAttribute,
  type WebGPURenderer,
} from 'three/webgpu'
import { AdditiveBlending, Vector3 } from 'three'
import {
  Fn,
  code,
  distance,
  float,
  hash,
  instancedArray,
  instanceIndex,
  length,
  mix,
  normalize,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
  wgslFn,
} from 'three/tsl'

export interface AttractorConfig {
  count?: number
  attractorCount?: number
  attractorStrength?: number
  damping?: number
  maxSpeed?: number
  baseSize?: number
  colorA?: string
  colorB?: string
}

export interface AttractorSystem {
  readonly count: number
  readonly renderer: WebGPURenderer
  readonly buffers: {
    spawnPositions: ReturnType<typeof instancedArray>
    offsetPositions: ReturnType<typeof instancedArray>
  }
  readonly uniforms: AttractorUniforms
  init: () => Promise<void>
  update: () => void
  createMesh: (options?: { additive?: boolean }) => InstancedMesh
  setAttractorPosition: (index: number, position: Vector3) => void
  dispose: () => void
}

export interface AttractorUniforms {
  attractorPositions: ReturnType<typeof uniform>
  attractorStrengths: ReturnType<typeof uniform>
  damping: ReturnType<typeof uniform>
  maxSpeed: ReturnType<typeof uniform>
  deltaTime: ReturnType<typeof uniform>
}

const defaultConfig: Required<AttractorConfig> = {
  count: 30000,
  attractorCount: 3,
  attractorStrength: 2.5,
  damping: 0.98,
  maxSpeed: 5.0,
  baseSize: 0.04,
  colorA: '#24dbf6',
  colorB: '#f77d2d',
}

export function createAttractorSystem(
  renderer: WebGPURenderer,
  config?: AttractorConfig,
): AttractorSystem {
  const opts = { ...defaultConfig, ...config }
  const count = opts.count
  const attractorCount = opts.attractorCount

  // Storage buffers
  const spawnPositionsBuffer = instancedArray(count, 'vec3')
  const offsetPositionsBuffer = instancedArray(count, 'vec3')

  const spawnPosition = spawnPositionsBuffer.element(instanceIndex)
  const offsetPosition = offsetPositionsBuffer.element(instanceIndex)

  // Uniforms
  const attractorPositions = uniform(
    new Float32Array(attractorCount * 3),
  )
  const attractorStrengths = uniform(
    new Float32Array(attractorCount).fill(opts.attractorStrength),
  )
  const damping = uniform(opts.damping)
  const maxSpeed = uniform(opts.maxSpeed)
  const deltaTime = uniform(1 / 60)

  // Hash function for random generation
  const hashCode = code(
    `
    fn hash(p: vec2f) -> f32 {
      var p3 = fract(vec3f(p.xyx) * 0.13);
      p3 += dot(p3, p3.yzx + 3.333);
      return fract((p3.x + p3.y) * p3.z);
    }
    `,
    [],
  )

  // Initialize particles in random positions
  const initCompute = Fn(() => {
    const idx = float(instanceIndex)
    const seed1 = hash(vec2(idx.mul(13.37), idx.mul(17.48)))
    const seed2 = hash(vec2(idx.mul(23.71), idx.mul(31.89)))
    const seed3 = hash(vec2(idx.mul(41.23), idx.mul(53.67)))

    // Random position in sphere
    const theta = seed1.mul(6.28318) // 2*PI
    const phi = seed2.acos().mul(2).sub(1)
    const radius = seed3.pow(1 / 3).mul(5.0)

    const x = radius.mul(phi.sin().mul(theta.cos()))
    const y = radius.mul(phi.sin().mul(theta.sin()))
    const z = radius.mul(phi.cos())

    spawnPositionsBuffer.element(instanceIndex).assign(vec3(x, y, z))
    offsetPositionsBuffer.element(instanceIndex).assign(vec3(0, 0, 0))
  }).compute(count)

  // Update particle positions based on attractors
  const updateCompute = wgslFn(
    `
    fn updateParticles(
      idx: u32,
      spawnPos: vec3f,
      offsetPos: vec3f,
      attractorPos: array<vec3f, ${attractorCount}>,
      attractorStr: array<f32, ${attractorCount}>,
      damp: f32,
      maxSpd: f32,
      dt: f32
    ) -> vec3f {
      let currentPos = spawnPos + offsetPos;
      var force = vec3f(0.0);
      
      // Calculate forces from all attractors
      for (var i = 0u; i < ${attractorCount}u; i++) {
        let toAttractor = attractorPos[i] - currentPos;
        let dist = max(length(toAttractor), 0.1);
        let strength = attractorStr[i] / (dist * dist);
        force += normalize(toAttractor) * strength;
      }
      
      // Apply force and damping
      var newOffset = offsetPos + force * dt;
      newOffset *= damp;
      
      // Clamp speed
      let speed = length(newOffset);
      if (speed > maxSpd) {
        newOffset = normalize(newOffset) * maxSpd;
      }
      
      return newOffset;
    }
  `,
  )

  const computeUpdate = Fn(() => {
    const attractorPosArray = []
    const attractorStrArray = []

    for (let i = 0; i < attractorCount; i++) {
      attractorPosArray.push(
        vec3(
          attractorPositions.element(i * 3),
          attractorPositions.element(i * 3 + 1),
          attractorPositions.element(i * 3 + 2),
        ),
      )
      attractorStrArray.push(attractorStrengths.element(i))
    }

    const newOffset = updateParticles({
      idx: instanceIndex,
      spawnPos: spawnPosition,
      offsetPos: offsetPosition,
      attractorPos: attractorPosArray,
      attractorStr: attractorStrArray,
      damp: damping,
      maxSpd: maxSpeed,
      dt: deltaTime,
    })

    offsetPositionsBuffer.element(instanceIndex).assign(newOffset)
  }).compute(count)

  // Position node for rendering
  const positionNode = Fn(() => {
    const pos = spawnPosition.add(offsetPosition)
    return pos
  })()

  // Color node based on distance and velocity
  const particleColor = wgslFn(
    `
    fn colorNode(
      spawnPos: vec3f,
      offsetPos: vec3f,
      uvCoord: vec2f
    ) -> vec4f {
      let color = vec3f(0.14, 0.86, 0.96)
      let accentColor = vec3f(0.97, 0.49, 0.18)
      
      let distanceToCenter = min(
        distance(spawnPos + offsetPos, vec3f(0.0, 0.0, 0.0)),
        5.0
      )
      
      let strength = distance(uvCoord, vec2f(0.5))
      
      let distColor = mix(
        accentColor,
        color,
        distanceToCenter * 0.2
      )
      
      let fillMask = 1.0 - strength * 2.0
      let finalColor = mix(vec3f(0.0), distColor, fillMask)
      
      let circle = smoothstep(0.5, 0.49, strength)
      return vec4f(finalColor * circle, circle)
    }
  `,
  )

  const colorNode = particleColor({
    spawnPos: spawnPosition,
    offsetPos: offsetPosition,
    uvCoord: uv(),
  })

  // Scale based on velocity
  const scaleNode = Fn(() => {
    const speed = length(offsetPosition)
    const baseScale = float(opts.baseSize)
    return baseScale.mul(float(1.0).add(speed.mul(0.1)))
  })()

  const resources: { mesh?: InstancedMesh } = {}

  const init = async () => {
    // Initialize default attractor positions
    for (let i = 0; i < attractorCount; i++) {
      const angle = (i / attractorCount) * Math.PI * 2
      const radius = 3
      attractorPositions.value[i * 3] = Math.cos(angle) * radius
      attractorPositions.value[i * 3 + 1] = Math.sin(angle) * radius
      attractorPositions.value[i * 3 + 2] = 0
    }

    await renderer.computeAsync(initCompute)
  }

  const update = () => {
    renderer.compute(computeUpdate)
  }

  const createMesh = ({ additive = true }: { additive?: boolean } = {}) => {
    if (resources.mesh) return resources.mesh

    const geometry = new PlaneGeometry(1, 1)
    const material = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: additive ? AdditiveBlending : undefined,
    })

    material.positionNode = positionNode
    material.colorNode = colorNode
    material.scaleNode = scaleNode

    const mesh = new InstancedMesh(geometry, material, count)
    mesh.frustumCulled = false

    resources.mesh = mesh
    return mesh
  }

  const setAttractorPosition = (index: number, position: Vector3) => {
    if (index >= 0 && index < attractorCount) {
      attractorPositions.value[index * 3] = position.x
      attractorPositions.value[index * 3 + 1] = position.y
      attractorPositions.value[index * 3 + 2] = position.z
    }
  }

  const dispose = () => {
    initCompute.dispose()
    computeUpdate.dispose()
    spawnPositionsBuffer.dispose?.()
    offsetPositionsBuffer.dispose?.()

    if (resources.mesh) {
      resources.mesh.geometry.dispose()
      ;(resources.mesh.material as MeshBasicNodeMaterial).dispose()
    }
  }

  return {
    count,
    renderer,
    buffers: {
      spawnPositions: spawnPositionsBuffer,
      offsetPositions: offsetPositionsBuffer,
    },
    uniforms: {
      attractorPositions,
      attractorStrengths,
      damping,
      maxSpeed,
      deltaTime,
    },
    init,
    update,
    createMesh,
    setAttractorPosition,
    dispose,
  }
}

