import { AgentConfig, AgentMessage, AgentResponse, AgentToolDefinition } from './types'

interface AgentRunContext {
  history: AgentMessage[]
  actions: AgentResponse['actions']
  tools: AgentToolDefinition[]
}

async function callOpenAI(model: string, messages: AgentMessage[], temperature: number) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI error ${response.status}: ${text}`)
  }

  return response.json()
}

async function maybeExecuteTool(
  toolCall: any,
  context: AgentRunContext,
): Promise<AgentMessage | null> {
  const tool = context.tools.find((t) => t.name === toolCall.function?.name)
  if (!tool) {
    return {
      role: 'tool',
      name: toolCall.function?.name ?? 'unknown',
      tool_call_id: toolCall.id,
      content: `Tool ${toolCall.function?.name ?? 'unknown'} not implemented`,
    }
  }

  const args = toolCall.function?.arguments
  let parsedArgs: Record<string, any> = {}

  if (typeof args === 'string') {
    try {
      parsedArgs = JSON.parse(args)
    } catch (error) {
      return {
        role: 'tool',
        name: tool.name,
        tool_call_id: toolCall.id,
        content: `Invalid arguments: ${String(error)}`,
      }
    }
  }

  const result = await tool.execute(parsedArgs, {
    history: context.history,
  })

  if (typeof result === 'string') {
    return {
      role: 'tool',
      name: tool.name,
      tool_call_id: toolCall.id,
      content: result,
    }
  }

  if (result?.action) {
    context.actions.push(result.action)
  }

  return {
    role: 'tool',
    name: tool.name,
    tool_call_id: toolCall.id,
    content: result?.content ?? '',
  }
}

export function createAgent(config: AgentConfig) {
  const model = config.model ?? (process.env.OPENAI_API_MODEL || 'gpt-4o-mini')
  const temperature = config.temperature ?? 0.4

  const systemMessage: AgentMessage = {
    role: 'system',
    content: config.systemPrompt,
  }

  return {
    async respond(input: { messages: AgentMessage[] }): Promise<AgentResponse> {
      const context: AgentRunContext = {
        history: [systemMessage, ...input.messages],
        actions: [],
        tools: config.tools ?? [],
      }

      const maxIterations = config.maxToolIterations ?? 4

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const completion = await callOpenAI(model, context.history, temperature)
        const choice = completion?.choices?.[0]
        const message = choice?.message

        if (!message) {
          throw new Error('No message returned from OpenAI')
        }

        if (message.tool_calls && message.tool_calls.length > 0) {
          context.history.push({
            role: 'assistant',
            content: message.content ?? '',
            name: config.name,
          })

          for (const toolCall of message.tool_calls) {
            const toolResult = await maybeExecuteTool(toolCall, context)
            if (toolResult) {
              context.history.push(toolResult)
            }
          }

          continue
        }

        if (!message.content) {
          throw new Error('Assistant response missing content')
        }

        context.history.push(message as AgentMessage)
        const historyForClient = context.history.filter((item) => item.role === 'assistant' || item.role === 'user')
        return {
          reply: message.content,
          actions: context.actions,
          updatedHistory: historyForClient,
        }
      }

      throw new Error('Agent exceeded max tool iterations')
    },
  }
}

