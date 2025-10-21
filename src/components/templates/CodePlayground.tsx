'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { registerTemplate } from './registry'
import { useStore } from '@/lib/store'

/**
 * CodePlayground Props Schema
 */
export const CodePlaygroundSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  initialCode: z.string(),
  language: z.enum(['glsl', 'wgsl', 'typescript', 'javascript']).default('glsl'),
  theme: z.enum(['dark', 'light']).default('dark'),
  showPreview: z.boolean().default(true),
})

export type CodePlaygroundProps = z.infer<typeof CodePlaygroundSchema>

/**
 * CodePlayground Template
 * 
 * Live code editor for TSL/GLSL/WGSL with real-time preview.
 * Allows users to experiment with shaders interactively.
 */
export function CodePlayground({
  title,
  description,
  initialCode,
  language = 'glsl',
  theme = 'dark',
  showPreview = true,
}: CodePlaygroundProps) {
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const setParams = useStore((state) => state.setParams)

  useEffect(() => {
    // Compile and run code
    const runCode = async () => {
      try {
        setError(null)
        setIsRunning(true)

        // Send code to 3D scene for compilation
        setParams({
          labs: {
            shaderTimeScale: 1,
            pointerStrength: 0.5,
            activeLabSlug: 'code-playground',
          },
          shaderCode: code,
          shaderLanguage: language,
          compileTimestamp: Date.now(),
        })

        setIsRunning(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Compilation error')
        setIsRunning(false)
      }
    }

    // Debounce code execution
    const timer = setTimeout(runCode, 500)
    return () => clearTimeout(timer)
  }, [code, language, setParams])

  return (
    <div className="my-16">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-3xl font-bold mb-2">{title}</h3>
        {description && (
          <p className="text-gray-400">{description}</p>
        )}
      </div>

      <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Code Editor */}
        <div className="relative">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
              {language.toUpperCase()}
            </span>
            {isRunning && (
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium animate-pulse">
                Compiling...
              </span>
            )}
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <span className="text-sm text-gray-500 ml-2">shader.{language}</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
              style={{
                tabSize: 2,
                lineHeight: '1.5',
              }}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
              <p className="text-red-400 text-sm font-mono">{error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setCode(initialCode)}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code)
              }}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <span className="text-sm text-gray-500">Live Preview</span>
              </div>

              <div className="aspect-square bg-black relative">
                {/* Preview renders in WebGPU canvas */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-600 text-sm">
                    Preview renders in 3D canvas above
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-blue-300 text-sm">
                💡 <strong>Tip:</strong> Edit the code above to see changes in real-time.
                The shader compiles automatically as you type.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Register template
registerTemplate({
  id: 'code-playground',
  name: 'Code Playground',
  component: CodePlayground,
  description: 'Live shader editor with real-time preview and compilation',
  schema: CodePlaygroundSchema,
  gsapTracks: [],
  preview: '/templates/code-playground.jpg',
})


