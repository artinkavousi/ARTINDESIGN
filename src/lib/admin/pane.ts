import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import type { AdminConfig } from './schemas'
import { defaultAdminConfig } from './schemas'

/**
 * AdminPane - Auto-generated Tweakpane UI from Zod schemas
 */
export class AdminPane {
  private pane: Pane
  private config: AdminConfig
  private listeners: Map<string, Set<(value: any) => void>>

  constructor(container: HTMLElement, initialConfig?: Partial<AdminConfig>) {
    this.config = { ...defaultAdminConfig, ...initialConfig }
    this.listeners = new Map()

    // Initialize Tweakpane
    this.pane = new Pane({
      container,
      title: 'Admin Controls',
      expanded: true,
    })

    // Register plugins
    this.pane.registerPlugin(EssentialsPlugin)

    // Build UI from schema
    this.buildCreativeControls()
    this.buildDevControls()
    this.buildPresets()
    this.buildExport()
  }

  /**
   * Build Creative Mode controls
   */
  private buildCreativeControls() {
    const folder = this.pane.addFolder({
      title: '🎨 Creative Mode',
      expanded: true,
    })

    // Colors
    const colors = folder.addFolder({ title: 'Colors', expanded: true })
    colors.addBinding(this.config.creative.colors, 'primary', {
      label: 'Primary',
    }).on('change', (ev) => this.notify('creative.colors.primary', ev.value))
    
    colors.addBinding(this.config.creative.colors, 'secondary', {
      label: 'Secondary',
    }).on('change', (ev) => this.notify('creative.colors.secondary', ev.value))
    
    colors.addBinding(this.config.creative.colors, 'accent', {
      label: 'Accent',
    }).on('change', (ev) => this.notify('creative.colors.accent', ev.value))

    // Effects - Bloom
    const bloom = folder.addFolder({ title: 'Bloom', expanded: false })
    bloom.addBinding(this.config.creative.effects.bloom, 'enabled', {
      label: 'Enabled',
    }).on('change', (ev) => this.notify('creative.effects.bloom.enabled', ev.value))
    
    bloom.addBinding(this.config.creative.effects.bloom, 'threshold', {
      label: 'Threshold',
      min: 0,
      max: 1,
      step: 0.01,
    }).on('change', (ev) => this.notify('creative.effects.bloom.threshold', ev.value))
    
    bloom.addBinding(this.config.creative.effects.bloom, 'intensity', {
      label: 'Intensity',
      min: 0,
      max: 3,
      step: 0.1,
    }).on('change', (ev) => this.notify('creative.effects.bloom.intensity', ev.value))

    // Effects - Grain
    const grain = folder.addFolder({ title: 'Grain', expanded: false })
    grain.addBinding(this.config.creative.effects.grain, 'enabled', {
      label: 'Enabled',
    }).on('change', (ev) => this.notify('creative.effects.grain.enabled', ev.value))
    
    grain.addBinding(this.config.creative.effects.grain, 'intensity', {
      label: 'Intensity',
      min: 0,
      max: 1,
      step: 0.01,
    }).on('change', (ev) => this.notify('creative.effects.grain.intensity', ev.value))

    // Motion
    const motion = folder.addFolder({ title: 'Motion', expanded: false })
    motion.addBinding(this.config.creative.motion, 'speed', {
      label: 'Speed',
      min: 0,
      max: 5,
      step: 0.1,
    }).on('change', (ev) => this.notify('creative.motion.speed', ev.value))
    
    motion.addBinding(this.config.creative.motion, 'amplitude', {
      label: 'Amplitude',
      min: 0,
      max: 2,
      step: 0.1,
    }).on('change', (ev) => this.notify('creative.motion.amplitude', ev.value))
  }

  /**
   * Build Dev Mode controls
   */
  private buildDevControls() {
    const folder = this.pane.addFolder({
      title: '⚙️ Dev Mode',
      expanded: false,
    })

    // Renderer
    const renderer = folder.addFolder({ title: 'Renderer', expanded: true })
    renderer.addBinding(this.config.dev.renderer, 'backend', {
      label: 'Backend',
      options: {
        WebGPU: 'webgpu',
        WebGL: 'webgl',
      },
    }).on('change', (ev) => this.notify('dev.renderer.backend', ev.value))
    
    renderer.addBinding(this.config.dev.renderer, 'dpr', {
      label: 'DPR',
      min: 0.5,
      max: 3,
      step: 0.1,
    }).on('change', (ev) => this.notify('dev.renderer.dpr', ev.value))

    // Debug
    const debug = folder.addFolder({ title: 'Debug', expanded: false })
    debug.addBinding(this.config.dev.debug, 'showFPS', {
      label: 'Show FPS',
    }).on('change', (ev) => this.notify('dev.debug.showFPS', ev.value))
    
    debug.addBinding(this.config.dev.debug, 'showWireframe', {
      label: 'Wireframe',
    }).on('change', (ev) => this.notify('dev.debug.showWireframe', ev.value))

    // Performance
    const perf = folder.addFolder({ title: 'Performance', expanded: false })
    perf.addBinding(this.config.dev.performance, 'maxFPS', {
      label: 'Max FPS',
      min: 30,
      max: 144,
      step: 1,
    }).on('change', (ev) => this.notify('dev.performance.maxFPS', ev.value))
  }

  /**
   * Build preset controls
   */
  private buildPresets() {
    const folder = this.pane.addFolder({
      title: '💾 Presets',
      expanded: false,
    })

    folder.addButton({ title: 'Save Preset' }).on('click', () => {
      const json = JSON.stringify(this.config, null, 2)
      localStorage.setItem('admin-preset', json)
      console.log('Preset saved:', this.config)
    })

    folder.addButton({ title: 'Load Preset' }).on('click', () => {
      const json = localStorage.getItem('admin-preset')
      if (json) {
        this.config = JSON.parse(json)
        this.pane.refresh()
        console.log('Preset loaded:', this.config)
      }
    })
  }

  /**
   * Build export controls
   */
  private buildExport() {
    const folder = this.pane.addFolder({
      title: '📤 Export',
      expanded: false,
    })

    folder.addButton({ title: 'Export JSON' }).on('click', () => {
      const json = JSON.stringify(this.config, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'admin-config.json'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  /**
   * Subscribe to config changes
   */
  public on(path: string, callback: (value: any) => void) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set())
    }
    this.listeners.get(path)!.add(callback)
  }

  /**
   * Notify listeners of changes
   */
  private notify(path: string, value: any) {
    const listeners = this.listeners.get(path)
    if (listeners) {
      listeners.forEach((callback) => callback(value))
    }
  }

  /**
   * Get current config
   */
  public getConfig(): AdminConfig {
    return this.config
  }

  /**
   * Dispose pane
   */
  public dispose() {
    this.pane.dispose()
    this.listeners.clear()
  }
}


