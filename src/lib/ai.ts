import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-4-20250514'

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  return new Anthropic({ apiKey })
}

export interface AIRequestOptions {
  systemPrompt: string
  userMessage: string
  maxTokens?: number
  temperature?: number
}

export interface StreamOptions {
  systemPrompt: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  maxTokens?: number
}

export async function callClaude({
  systemPrompt,
  userMessage,
  maxTokens = 4096,
}: AIRequestOptions): Promise<string> {
  const client = getClient()

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      return textBlock ? textBlock.text : ''
    } catch (error) {
      lastError = error as Error
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }
  throw lastError || new Error('Failed to call Claude API')
}

export function parseJSONFromAI(text: string): unknown {
  // Try to extract JSON from markdown code blocks first
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim())
    } catch {
      // Fall through to direct parse
    }
  }

  // Try direct parse
  try {
    return JSON.parse(text.trim())
  } catch {
    // Try to find JSON object/array in the text
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0])
      } catch {
        // Fall through
      }
    }

    const arrayMatch = text.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0])
      } catch {
        // Fall through
      }
    }

    throw new Error('Could not parse JSON from AI response')
  }
}

export async function streamClaude({
  systemPrompt,
  messages,
  maxTokens = 4096,
}: StreamOptions): Promise<ReadableStream<Uint8Array>> {
  const client = getClient()

  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const data = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}
