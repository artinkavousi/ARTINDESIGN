import { NextResponse } from 'next/server'
import { builderAgent } from '@/lib/agents/builder'
import type { AgentMessage } from '@/lib/agents/types'

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: AgentMessage[] }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  try {
    const result = await builderAgent.respond({ messages })
    return NextResponse.json({
      message: result.reply,
      actions: result.actions,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

