import { createAgent } from './createAgent'
import type { AgentMessage } from './types'

const navigationHistory: { path: string; timestamp: number }[] = []

export const uxAssistantAgent = createAgent({
  name: 'UXAssistant',
  systemPrompt:
    'You are the UX assistant for the Engine-First WebGPU site. Help users navigate and explain features succinctly. You can invoke tools to navigate to routes.',
  tools: [
    {
      name: 'navigate',
      description: 'Navigate the user to a different path on the site',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'A valid pathname beginning with /',
          },
        },
        required: ['path'],
      },
      async execute(args) {
        const path = typeof args.path === 'string' ? args.path : '/'

        navigationHistory.push({ path, timestamp: Date.now() })

        return {
          content: `Navigating to ${path}`,
          action: {
            type: 'navigate',
            payload: { path },
          },
        }
      },
    },
  ],
})

export async function runUXAssistant(messages: AgentMessage[]) {
  return uxAssistantAgent.respond({ messages })
}
export {}

