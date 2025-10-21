# TSL & WebGPU Enhancements Plan
## Discovered from Portfolio Examples & TSL WebGPU Projects

Based on comprehensive analysis of:
- `blog.maximeheckel.com-main` - Advanced TSL WebGPU patterns
- `portfolio-main` - Production TSL utilities
- `fragments-boilerplate-main` - TSL module organization
- `fluidglass-main`, `interactwave-main`, `roquefort-main` - Fluid simulation patterns
- Other WebGPU/TSL examples

---

## 🎯 Phase 1: Core TSL Utilities (High Priority)

### 1.1 Rotation & Transform Utilities
**Location**: `src/lib/tsl/utils/transform/`

#### Missing Utilities:
- ✅ **`rotate-y.ts`** - Y-axis rotation matrix (already have `rotate-3d-y.ts`)
- **`rotate-z.ts`** - Z-axis rotation matrix
- **`rotation-xyz.ts`** - Full Euler rotation matrix
- **`look-at.ts`** - Look-at matrix for camera/object orientation

```typescript
// Example: rotation-xyz.ts
import { Fn, cos, sin, float, mat3, vec3 } from 'three/tsl'

export const rotationXYZ = Fn(([euler]) => {
  const a = float(cos(euler.x))
  const b = float(sin(euler.x))
  const c = float(cos(euler.y))
  const d = float(sin(euler.y))
  const e = float(cos(euler.z))
  const f = float(sin(euler.z))
  const ae = float(a.mul(e))
  const af = float(a.mul(f))
  const be = float(b.mul(e))
  const bf = float(b.mul(f))

  return mat3(
    vec3(c.mul(e), af.add(be.mul(d)), bf.sub(ae.mul(d))),
    vec3(c.negate().mul(f), ae.sub(bf.mul(d)), be.add(af.mul(d))),
    vec3(d, b.negate().mul(c), a.mul(c)),
  )
}).setLayout({
  name: 'rotationXYZ',
  type: 'mat3',
  inputs: [{ name: 'euler', type: 'vec3' }],
})
```

### 1.2 Position Generation Utilities
**Location**: `src/lib/tsl/utils/position/`

#### New Utilities:
- **`position-sphere-rand.ts`** - Random sphere distribution
- **`position-cube-grid.ts`** - Grid-based cube positions
- **`position-fibonacci-sphere.ts`** - Even sphere distribution
- **`position-halton-sequence.ts`** - Low-discrepancy sampling

```typescript
// Example: position-sphere-rand.ts
import { Fn, PI2, hash, instanceIndex, vec3 } from 'three/tsl'

export const positionSphereRand = Fn<{ radius: number }>(({ radius }) => {
  const seed = hash(instanceIndex.add(1))
  const seed2 = hash(instanceIndex.add(2))
  const seed3 = hash(instanceIndex.add(3))

  const distanceFactor = seed.pow(1 / 3)

  const theta = seed2.mul(PI2)
  const phi = seed3.acos().mul(2).sub(1)

  const x = distanceFactor.mul(phi.sin().mul(theta.cos())).mul(radius)
  const y = distanceFactor.mul(phi.sin().mul(theta.sin())).mul(radius)
  const z = distanceFactor.mul(phi.cos()).mul(radius)

  return vec3(x, y, z)
})
```

### 1.3 Image & Texture Utilities
**Location**: `src/lib/tsl/utils/image/`

#### New Utilities:
- **`uv-cover.ts`** - CSS `object-fit: cover` for textures
- **`uv-contain.ts`** - CSS `object-fit: contain` for textures
- **`uv-distort.ts`** - Distortion effects
- **`parallax-uv.ts`** - Parallax mapping

```typescript
// Example: uv-cover.ts
import { Fn, float, select, vec2 } from 'three/tsl'

export const coverTextureUv = Fn(([imgSize, planeSize, ouv]) => {
  const s = vec2(planeSize)
  const i = vec2(imgSize)
  const rs = float(s.x.div(s.y))
  const ri = float(i.x.div(i.y))
  
  const newUv = vec2(
    select(rs.lessThan(ri), 
      vec2(i.x.mul(s.y).div(i.y), s.y), 
      vec2(s.x, i.y.mul(s.x).div(i.x))
    ),
  )
  
  const offset = vec2(
    select(rs.lessThan(ri), 
      vec2(newUv.x.sub(s.x).div(2.0), 0.0), 
      vec2(0.0, newUv.y.sub(s.y).div(2.0))
    ).div(newUv),
  )
  
  const uv = vec2(ouv.mul(s).div(newUv).add(offset))
  return uv
}).setLayout({
  name: 'coverTextureUv',
  type: 'vec2',
  inputs: [
    { name: 'imgSize', type: 'vec2' },
    { name: 'planeSize', type: 'vec2' },
    { name: 'ouv', type: 'vec2' },
  ],
})
```

---

## 🎨 Phase 2: Advanced Effects & Materials

### 2.1 Refraction & Glass Effects
**Location**: `src/lib/tsl/effects/`

#### New Effects:
- **`refraction.ts`** - Chromatic refraction with absorption
- **`glass-material.ts`** - Complete glass shader with fresnel
- **`caustics.ts`** - Underwater caustics effect
- **`subsurface-scattering.ts`** - SSS for organic materials

**Features**:
- Multi-pass refraction with RGB channel separation
- Fresnel rim lighting
- IOR (Index of Refraction) controls
- Absorption and tinting
- Normal-based distortion

### 2.2 Advanced Lighting Models
**Location**: `src/lib/tsl/lighting/`

#### New Lighting:
- **`pbr-lighting.ts`** - Full PBR lighting model
- **`specular-ggx.ts`** - GGX specular BRDF
- **`iridescence.ts`** - Thin-film interference
- **`subsurface.ts`** - Subsurface scattering approximation
- **`rim-light.ts`** - Rim/edge lighting

### 2.3 Post-Processing Nodes
**Location**: `src/lib/tsl/postfx/`

#### New Post-FX:
- **`chromatic-aberration.ts`** - RGB channel separation
- **`depth-of-field.ts`** - Bokeh DOF with TSL
- **`motion-blur.ts`** - Velocity-based motion blur
- **`outline-effect.ts`** - Sobel edge detection outline
- **`glitch-effect.ts`** - Digital glitch distortion
- **`color-grading.ts`** - LUT-based color grading

---

## 🧮 Phase 3: Compute Shader Systems

### 3.1 Advanced Particle Systems
**Location**: `src/lib/tsl/compute/particles/`

#### New Systems:
- **`attractor-particles.ts`** - N-body attractor simulation
- **`flock-particles.ts`** - Boids/flocking behavior
- **`trail-particles.ts`** - Mouse trail particles
- **`physics-particles.ts`** - Simple physics simulation
- **`vortex-particles.ts`** - Vortex force field

**Features from discovered examples**:
- Lorenz attractor implementation
- Multi-attractor forces
- Instanced buffer attributes
- WGSL custom functions
- Collision detection

### 3.2 Fluid Simulation Enhancements
**Location**: `src/lib/tsl/compute/fluid/`

#### New Fluid Systems:
- **`navier-stokes-2d.ts`** - Full NS solver
- **`advection.ts`** - Velocity advection
- **`pressure-solver.ts`** - Poisson pressure solve
- **`vorticity-confinement.ts`** - Vorticity preservation
- **`reaction-diffusion.ts`** - Pattern formation

**Patterns from `fluidglass-main`**:
- Dual-buffer ping-pong technique
- Shader node composition
- Canvas renderer integration
- Optimized compute passes

### 3.3 GPU-Driven Deformations
**Location**: `src/lib/tsl/compute/deform/`

#### New Deformation Systems:
- **`vertex-displacement.ts`** - Vertex animation
- **`mesh-explosion.ts`** - Mesh shattering
- **`cloth-simulation.ts`** - Simple cloth physics
- **`soft-body.ts`** - Soft body deformation

---

## 📊 Phase 4: Utility Nodes & Helpers

### 4.1 Math Utilities
**Location**: `src/lib/tsl/math/`

#### Additional Math:
- **`ease-functions.ts`** - Cubic-bezier, elastic, bounce
- **`quaternion.ts`** - Quaternion operations
- **`matrix-operations.ts`** - Matrix utilities
- **`vector-field.ts`** - Vector field generation
- **`interpolation.ts`** - Various interpolation methods

### 4.2 Color Utilities
**Location**: `src/lib/tsl/utils/color/`

#### Additional Color:
- **`hsl-conversion.ts`** - RGB ↔ HSL conversion
- **`color-temperature.ts`** - Blackbody radiation colors
- **`gradient-generator.ts`** - Multi-stop gradients
- **`color-mixing.ts`** - Advanced blending modes

### 4.3 SDF (Signed Distance Field) Library
**Location**: `src/lib/tsl/sdf/`

#### Expanded SDF:
- **`primitives/`** - Box, torus, cylinder, cone, capsule
- **`modifiers/`** - Round, onion, extrude, revolutionize
- **`combining/`** - Smooth union/subtract/intersect
- **`raymarching.ts`** - Sphere tracing implementation

---

## 🧪 Phase 5: New Lab Experiments

### 5.1 Advanced Labs to Add
**Location**: `src/content/labs/` & `src/scenes/labs/`

#### New Lab Ideas:
1. **`glass-blob`** - Animated glass blob with refraction
2. **`n-body-simulation`** - Gravitational attractor system
3. **`outline-effect`** - Compute shader-based outline
4. **`cloth-simulation`** - GPU cloth with pointer interaction
5. **`reaction-diffusion`** - Pattern formation system
6. **`caustics-underwater`** - Underwater caustics simulation
7. **`flock-simulation`** - Boids flocking behavior
8. **`vertex-displacement`** - Animated mesh deformation
9. **`smoke-simulation`** - Volume rendering smoke
10. **`metaballs`** - Marching cubes metaballs

### 5.2 Integration Examples
**Location**: `src/examples/` or `src/content/examples/`

- **Material Playground** - Live material editor
- **Compute Shader Playground** - Live compute editor
- **Particle Designer** - Visual particle system builder
- **Fluid Painter** - Interactive fluid canvas
- **SDF Modeler** - Real-time SDF modeling

---

## 🔧 Phase 6: Developer Tools & Infrastructure

### 6.1 TSL Development Tools
**Location**: `src/lib/tsl/dev/`

#### New Tools:
- **`tsl-transpiler.ts`** - Helper to transpile GLSL → TSL
- **`shader-debugger.ts`** - Visual shader debugging
- **`performance-monitor.ts`** - GPU performance tracking
- **`node-graph-visualizer.ts`** - TSL node graph visualization

### 6.2 Code Generation
**Location**: `scripts/`

#### New Scripts:
- **`generate-tsl-module.js`** - Auto-generate TSL modules
- **`generate-lab-template.js`** - Auto-generate lab boilerplate
- **`optimize-shaders.js`** - Shader optimization pass

---

## 📦 Implementation Priority

### **Immediate (This Session)**
1. ✅ Rotation utilities (rotate-z, rotation-xyz)
2. ✅ Position generation (sphere-rand, cube-grid)
3. ✅ UV/Image utilities (cover, contain)
4. ✅ Refraction/Glass material
5. ✅ Chromatic aberration post-FX
6. ✅ Attractor particle system

### **High Priority (Next Session)**
1. Advanced lighting models (PBR, GGX, iridescence)
2. Depth-of-field post-FX
3. Outline effect with compute shaders
4. Fluid simulation enhancements
5. Flock particles (boids)
6. New labs: glass-blob, n-body-simulation

### **Medium Priority**
1. SDF library expansion
2. Cloth simulation
3. Reaction-diffusion patterns
4. Color utilities expansion
5. Math utilities (easing, quaternions)

### **Low Priority (Polish)**
1. Developer tools
2. Code generation scripts
3. Documentation enhancements
4. Performance optimization passes

---

## 🎯 Key Patterns Discovered

### From Maxime Heckel's Blog:
- **Custom TempNode** for post-processing effects
- **Storage textures** for compute output
- **Multi-pass rendering** (normal pass → depth pass → effect pass)
- **WGSL custom functions** with `wgslFn()`
- **Varying nodes** for per-vertex data
- **Dynamic normal recalculation** for displaced geometry

### From Portfolio Projects:
- **Position node displacement** with proper normal updates
- **Orthogonal tangent calculation** for smooth normals
- **Fresnel-based effects** (rim lighting, glass)
- **UV transformation functions** (cover, contain, distort)
- **Rotation matrix utilities** for transformations

### From Fluid Simulations:
- **Ping-pong buffer technique** for iterative solvers
- **Shader node composition** for modular effects
- **Multi-pass advection** for stability
- **Pressure solve** for incompressible flow
- **Vorticity confinement** for energy preservation

---

## 🚀 Next Steps

1. **Implement Immediate Priority** utilities (this session)
2. **Create 2-3 new labs** showcasing new TSL features
3. **Integrate advanced materials** into existing demos
4. **Expand compute shader** capabilities
5. **Document patterns** for future reference
6. **Optimize performance** across all new modules

---

## 📝 Notes

- All modules should follow **Single-File Module** philosophy
- Use **TypeScript** with full type safety
- Export **named exports** (no default exports)
- Include **JSDoc comments** for all public APIs
- Ensure **WebGPU-first** implementation
- Provide **sensible defaults** for all parameters
- Include **dispose()** methods for cleanup

**Total New Modules**: ~50-60 files
**Total New Labs**: 10 experiments
**Estimated Implementation**: 3-4 sessions for full completion

