import { eq, or, and } from "@arkiv-network/sdk/query"
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils"
import type { Hex } from "@arkiv-network/sdk"
import type { AgentMode } from "./sessions"
import { publicClient, createSigningClient, PROJECT_ATTRIBUTE } from "./client"

export type InsightCategory = "risk" | "finding" | "alert" | "reminder" | "clause" | "deadline" | "symptom" | "pattern" | "methodology" | "gap"

export type InsightPayload = {
  summary: string
  detail: string
  sourceMessageIndex: string
}

export async function saveInsight(
  walletClient: any,
  {
    sessionKey,
    mode,
    category,
    summary,
    detail,
    sourceMessageIndex,
    ttlDays,
  }: {
    sessionKey: Hex
    mode: AgentMode
    category: InsightCategory
    summary: string
    detail: string
    sourceMessageIndex: number
    ttlDays: number
  },
) {
  const signer = createSigningClient(walletClient)
  const owner = walletClient.account.address as Hex
  const payload: InsightPayload = { summary, detail, sourceMessageIndex: String(sourceMessageIndex) }
  return signer.createEntity({
    payload: jsonToPayload(payload),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays * 2),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "agent_insight" },
      { key: "sessionId", value: sessionKey },
      { key: "owner", value: owner },
      { key: "category", value: category },
      { key: "mode", value: mode },
      { key: "pinned", value: "true" },
    ],
  })
}

export async function fetchInsights(ownerAddress: Hex, mode: AgentMode) {
  return publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", "agent_insight"),
      eq("owner", ownerAddress),
      eq("mode", mode),
      eq("pinned", "true"),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .fetch()
}

export async function fetchSessionInsights(sessionKey: Hex) {
  return publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", "agent_insight"),
      eq("sessionId", sessionKey),
      eq("pinned", "true"),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .fetch()
}

// Fetch insights filtered by one or more categories using or() compound predicate.
export async function fetchInsightsByCategory(
  sessionKey: Hex,
  categories: InsightCategory[],
) {
  if (categories.length === 0) return fetchSessionInsights(sessionKey)

  const categoryFilter =
    categories.length === 1
      ? eq("category", categories[0])
      : or(categories.map((c) => eq("category", c)))

  return publicClient
    .buildQuery()
    .where([
      and([
        eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
        eq("type", "agent_insight"),
        eq("sessionId", sessionKey),
        eq("pinned", "true"),
        categoryFilter,
      ]),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .fetch()
}
