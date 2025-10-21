'use client'

import { useEffect, useRef, useState } from 'react'
import { AdminPane } from '@/lib/admin/pane'
import { useStore } from '@/lib/store'
import { BuilderChat } from '@/components/admin/BuilderChat'

export default function AdminPage() {
  const paneContainerRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<AdminPane | null>(null)
  const [fps, setFps] = useState(60)
  const setParams = useStore((state) => state.setParams)

  useEffect(() => {
    if (!paneContainerRef.current || paneRef.current) return

    // Initialize Tweakpane
    const pane = new AdminPane(paneContainerRef.current)
    paneRef.current = pane

    // Subscribe to changes and sync to Zustand store
    pane.on('creative.colors.primary', (value) => {
      setParams({ colorPrimary: value })
    })

    pane.on('creative.colors.secondary', (value) => {
      setParams({ colorSecondary: value })
    })

    pane.on('creative.effects.bloom.enabled', (value) => {
      setParams({ bloomEnabled: value })
    })

    pane.on('creative.effects.bloom.intensity', (value) => {
      setParams({ bloomIntensity: value })
    })

    pane.on('creative.motion.speed', (value) => {
      setParams({ motionSpeed: value })
    })

    pane.on('dev.debug.showFPS', (value) => {
      setParams({ showFPS: value })
    })

    pane.on('dev.debug.showWireframe', (value) => {
      setParams({ showWireframe: value })
    })

    // FPS Counter
    let frameCount = 0
    let lastTime = performance.now()

    const updateFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)))
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(updateFPS)
    }
    updateFPS()

    // Cleanup
    return () => {
      pane.dispose()
      paneRef.current = null
    }
  }, [setParams])

  return (
    <main className="min-h-screen pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">
            Control scene parameters, debug rendering, and manage presets
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Stats Panel */}
          <div className="xl:col-span-1 space-y-4">
            <StatsCard title="Performance">
              <div className="space-y-3">
                <StatRow label="FPS" value={fps} />
                <StatRow label="Renderer" value="WebGPU" />
                <StatRow label="Scene Objects" value="42" />
              </div>
            </StatsCard>

            <StatsCard title="Quick Actions">
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Reload Scene
                </button>
                <button
                  onClick={() => {
                    const config = paneRef.current?.getConfig()
                    console.log('Current Config:', config)
                  }}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Log Config
                </button>
              </div>
            </StatsCard>

            <StatsCard title="Navigation">
              <div className="space-y-2 text-sm">
                <a href="/" className="block text-purple-400 hover:text-purple-300">
                  → Home
                </a>
                <a href="/blog" className="block text-purple-400 hover:text-purple-300">
                  → Blog
                </a>
                <a href="/labs" className="block text-purple-400 hover:text-purple-300">
                  → Labs
                </a>
              </div>
            </StatsCard>
          </div>

          {/* Tweakpane Container */}
          <div className="xl:col-span-2">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 min-h-[600px]">
              <div ref={paneContainerRef} className="w-full" />
            </div>
          </div>

          {/* Builder Agent Console */}
          <div className="xl:col-span-1">
            <BuilderChat />
          </div>
        </div>
      </div>
    </main>
  )
}

function StatsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  )
}

