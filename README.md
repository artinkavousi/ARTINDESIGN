# WebGPU Creative Lab

A modern, engine-first web application built with Next.js 15, React Three Fiber, and Three.js WebGPU/TSL. Features a persistent 3D canvas across routes, interactive shader experiments, and a comprehensive content system.

## 🚀 Features

### Core Architecture
- **Engine-First Design**: Persistent WebGPU canvas across all routes
- **Route-Based Scenes**: Automatic scene switching based on URL
- **TSL-First Shading**: Three.js Shading Language for all shader logic
- **Zero Config**: Components work out-of-the-box with sensible defaults

### Content System
- **Contentlayer Integration**: MDX-based blog with type-safe content
- **Template System**: Reusable article templates with prop validation
- **Dynamic Components**: Load templates in MDX with full TypeScript support
- **Scene Props**: Pass parameters from frontmatter to 3D scenes

### Animation & Motion
- **Motion.dev**: Smooth page transitions and layout animations
- **GSAP**: Cinematic scroll effects and text reveals
- **Stagger Animations**: Coordinated element entrance effects

### TSL Library
Organized collection of reusable TSL utilities:
- **Noise**: Simplex, Perlin, Curl (3D/4D), FBM, Turbulence
- **Lighting**: Ambient, Diffuse, Directional, Fresnel, Hemisphere
- **Math**: SDF operations, coordinate transforms, easing functions
- **Post-FX**: Grain, Vignette, Bloom, LCD, Canvas Weave
- **Utils**: Color palettes, tonemapping, aspect utilities

### Admin Dashboard
- **Tweakpane Integration**: Auto-generated UI from Zod schemas
- **Live Controls**: Real-time scene parameter adjustment
- **Presets**: Save/load configuration presets
- **Dev Tools**: FPS monitoring, debug visualization

## 📦 Tech Stack

```
Framework: Next.js 15 (App Router) + React 19 + TypeScript
3D Engine: React Three Fiber + Three.js r180 (WebGPU)
Animation: Motion.dev + GSAP
Content: Contentlayer (MDX)
State: Zustand
Styling: Tailwind CSS
Admin: Tweakpane + Zod
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout with persistent canvas
│   ├── page.tsx           # Home page
│   ├── blog/              # Blog routes
│   │   ├── page.tsx       # Blog listing
│   │   └── [slug]/        # Individual posts
│   ├── labs/              # Experiments
│   └── admin/             # Admin dashboard
├── components/
│   ├── canvas/            # WebGPU canvas components
│   │   ├── WebGPUScene.tsx
│   │   ├── WebGPUSketch.tsx
│   │   └── ColorCorrection.tsx
│   ├── motion/            # Animation components
│   │   ├── PageTransition.tsx
│   │   └── ScrollEffects.tsx
│   └── templates/         # Article templates
│       ├── registry.ts
│       ├── ShaderHero.tsx
│       ├── Floating3D.tsx
│       └── TemplateLoader.tsx
├── lib/
│   ├── tsl/              # TSL utilities library
│   │   ├── noise/
│   │   ├── lighting/
│   │   ├── math/
│   │   ├── postfx/
│   │   └── utils/
│   ├── store.ts          # Zustand state
│   ├── scenes.ts         # Scene resolver
│   ├── utils.ts          # Helper functions
│   └── admin/            # Admin utilities
│       ├── schemas.ts
│       └── pane.ts
├── scenes/               # Per-route 3D scenes
│   ├── home/
│   └── portfolio/
└── content/              # MDX content
    └── posts/
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm/pnpm/yarn
- Browser with WebGPU support (Chrome/Edge 113+)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

Visit `http://localhost:3000` to see the site.

- **Home**: `/` - Landing page with features
- **Blog**: `/blog` - Article listing
- **Labs**: `/labs` - Experiments (coming soon)
- **Admin**: `/admin` - Control dashboard

## 📝 Creating Content

### Blog Posts

Create MDX files in `content/posts/`:

```mdx
---
title: "My Article"
summary: "Article description"
publishedAt: "2025-01-20"
slug: "my-article"
templateId: "shader-hero"
sceneProps:
  shaderType: "noise"
  intensity: 1.5
tags: ["webgpu", "tsl"]
featured: true
---

Your content here...
```

### Templates

Use templates in MDX:

```mdx
import { TemplateLoader } from '@/components/templates/TemplateLoader'

<TemplateLoader
  templateId="shader-hero"
  props={{
    title: "Hello WebGPU",
    subtitle: "Subtitle here",
    shaderType: "noise",
    intensity: 1.5
  }}
/>
```

### Creating New Templates

1. Create component in `src/components/templates/`
2. Define Zod schema for props
3. Register with `registerTemplate()`
4. Use in MDX with `TemplateLoader`

## 🎨 Admin Dashboard

Access at `/admin` to control:

- **Creative Mode**: Colors, effects, motion parameters
- **Dev Mode**: Renderer settings, debug tools, performance
- **Presets**: Save/load configurations
- **Export**: Download config as JSON

## 🧩 TSL Library Usage

```typescript
import { simplexNoise3d, cosinePalette } from '@/lib/tsl'
import { Fn, vec3 } from 'three/tsl'

const myShader = Fn(() => {
  const noise = simplexNoise3d(position.mul(scale))
  const color = cosinePalette(noise, colorA, colorB, colorC, colorD)
  return vec3(color)
})
```

## 🎯 Scene Integration

Scenes automatically resolve based on route:

```typescript
// lib/scenes.ts
const sceneMap = {
  '/': HomeScene,
  '/portfolio': PortfolioScene,
  '/blog': HomeScene, // Fallback
}
```

Create scenes in `src/scenes/[name]/Scene.tsx`:

```tsx
export function HomeScene() {
  const params = useStore((state) => state.params)
  
  return (
    <>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color={params.colorPrimary} />
      </mesh>
    </>
  )
}
```

## 📚 Key Patterns

### Single-File Modules
Each TSL utility is self-contained with no external config required.

### Schema-Driven
Admin controls auto-generate from Zod schemas.

### Template Registry
Templates register themselves on import.

### Route-Based Scenes
3D content automatically switches with navigation.

## 🐛 Known Issues

- React 19 peer dependency warnings with some packages (safe to ignore)
- shadcn/ui components need manual installation due to React 19
- Contentlayer needs rehype/remark plugins installed separately
- Some TSL files have linter warnings (intentional for generated code)

## 🔮 Roadmap

- [ ] Additional templates (ParticleScroll, CodePlayground, Gallery3D)
- [ ] Lab experiments (GPU particles, fluid simulation, shader playground)
- [ ] OpenAI AgentKit integration (UX Assistant + Builder Agent)
- [ ] Sanity CMS for portfolio content
- [ ] Cloudflare Pages deployment
- [ ] Pagefind search integration
- [ ] Compute shader examples

## 📄 License

MIT

## 🙏 Acknowledgments

Built with patterns from:
- [Fragments Boilerplate](https://github.com/supahkenneth/fragments-boilerplate) - WebGPU canvas pattern
- [Portfolio Main](https://github.com/ethanova/portfolio-main) - TSL utilities organization
- [Maxime Heckel Blog](https://github.com/MaximeHeckel/blog.maximeheckel.com) - Content patterns

