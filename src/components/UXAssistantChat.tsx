'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AgentMessage, NavigationAction } from '@/lib/agents/types'

export function UXAssistantChat() {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const STORAGE_KEY = 'ux-assistant-chat-v1'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const cached = window.localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as AgentMessage[]
        setMessages(parsed)
      } catch (error) {
        console.warn('Failed to parse UX assistant history', error)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const nextMessages: AgentMessage[] = [
      ...messages,
      { role: 'user', content: input },
    ]

    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ux-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      const json = await response.json()
      if (json.error) {
        throw new Error(json.error)
      }

      const nextHistory = json.history as AgentMessage[] | undefined

      if (nextHistory && nextHistory.length) {
        setMessages(nextHistory)
      } else if (json.message) {
        setMessages([
          ...nextMessages,
          { role: 'assistant', content: json.message },
        ])
      }

      if (Array.isArray(json.actions)) {
        json.actions.forEach((action: NavigationAction) => {
          if (action.type === 'navigate' && action.payload?.path) {
            router.push(action.payload.path)
          }
        })
      }
    } catch (error: any) {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: `Error: ${error.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-gray-950/95 backdrop-blur border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-purple-300">UX Assistant</h2>
          <p className="text-xs text-gray-500">Ask about navigation or features</p>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="max-h-80 overflow-y-auto p-4 space-y-3 text-sm text-gray-100"
      >
        {messages.length === 0 ? (
          <p className="text-gray-500 text-xs">
            Hi! I can guide you around the Engine-First WebGPU site. Try “Where are the labs?”
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === 'assistant'
                  ? 'bg-purple-950/50 border border-purple-900/50 rounded-xl p-3'
                  : 'bg-gray-900/80 border border-gray-800 rounded-xl p-3'
              }
            >
              <p className="text-xs text-gray-500 mb-1">{message.role}</p>
              <p>{message.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-800 bg-gray-900/80">
        <div className="flex gap-2">
          <input
            value={input}
            disabled={loading}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask the assistant..."
            className="flex-1 px-3 py-2 rounded-lg bg-gray-950 border border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-sm font-semibold"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

