import Anthropic from "@anthropic-ai/sdk"
import { buildSystemPromptWithMemory } from "@/lib/ai/memory"
import type { AgentMode } from "@/lib/arkiv/sessions"
import type { Hex } from "@arkiv-network/sdk"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages, mode, ownerAddress } = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>
      mode: AgentMode
      ownerAddress: Hex
    }

    if (!messages || !mode || !ownerAddress) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const systemPrompt = await buildSystemPromptWithMemory(mode, ownerAddress)

    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`,
                ),
              )
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
          controller.close()
        } catch (err) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`,
            ),
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
