export type AgentRole = 'system' | 'user' | 'assistant' | 'tool'

export interface AgentMessage {
  role: AgentRole
  content: string
  name?: string
  tool_call_id?: string
}

export interface AgentAction {
  type: string
  payload?: Record<string, any>
}

export interface AgentToolExecutionContext {
  history: AgentMessage[]
}

export interface AgentToolDefinition {
  name: string
  description: string
  parameters: Record<string, any>
  execute: (args: Record<string, any>, context: AgentToolExecutionContext) => Promise<ToolResult> | ToolResult
}

export type ToolResult =
  | string
  | {
      content?: string
      action?: AgentAction
      data?: unknown
    }

export interface AgentConfig {
  name: string
  systemPrompt: string
  model?: string
  temperature?: number
  tools?: AgentToolDefinition[]
  maxToolIterations?: number
}

export interface AgentResponse {
  reply: string
  actions: AgentAction[]
  updatedHistory: AgentMessage[]
}

export interface NavigationAction extends AgentAction {
  type: 'navigate'
  payload: { path: string }
}

