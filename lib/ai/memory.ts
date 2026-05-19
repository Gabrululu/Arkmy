import type { Hex } from "@arkiv-network/sdk"
import type { AgentMode } from "@/lib/arkiv/sessions"
import type { InsightPayload } from "@/lib/arkiv/insights"
import { fetchInsights } from "@/lib/arkiv/insights"
import { SYSTEM_PROMPTS } from "./prompts"

export async function buildSystemPromptWithMemory(
  mode: AgentMode,
  ownerAddress: Hex,
): Promise<string> {
  const basePrompt = SYSTEM_PROMPTS[mode]

  try {
    const result = await fetchInsights(ownerAddress, mode)
    if (result.entities.length === 0) return basePrompt

    const insightsSummary = result.entities
      .map((e) => {
        try {
          const payload = e.toJson() as InsightPayload
          return `- ${payload.summary}`
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .join("\n")

    if (!insightsSummary) return basePrompt

    return `${basePrompt}

## Your memory from previous sessions (stored on Arkiv, owned by user's wallet):
${insightsSummary}

Use this context for continuity, but respect that the user controls how long this memory persists via their TTL settings.`
  } catch {
    return basePrompt
  }
}
