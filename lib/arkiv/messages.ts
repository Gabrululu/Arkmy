import { eq, asc } from "@arkiv-network/sdk/query"
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils"
import type { Hex } from "@arkiv-network/sdk"
import type { AgentMode } from "./sessions"
import { publicClient, createSigningClient, PROJECT_ATTRIBUTE, type ConnectedWalletClient } from "./client"

export type MessageRole = "user" | "assistant"

export type MessagePayload = {
  role: MessageRole
  content: string
  hasAttachment: boolean
  fileName?: string
}

export async function saveMessage(
  walletClient: ConnectedWalletClient,
  {
    sessionKey,
    role,
    content,
    messageIndex,
    ttlDays,
    hasAttachment = false,
    fileName,
  }: {
    sessionKey: Hex
    role: MessageRole
    content: string
    messageIndex: number
    ttlDays: number
    hasAttachment?: boolean
    fileName?: string
  },
) {
  const signer = createSigningClient(walletClient)
  const owner = walletClient.account.address as Hex
  const payload: MessagePayload = { role, content, hasAttachment, fileName }
  return signer.createEntity({
    payload: jsonToPayload(payload),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "agent_message" },
      { key: "sessionId", value: sessionKey },
      { key: "owner", value: owner },
      { key: "messageIndex", value: messageIndex },
      { key: "role", value: role },
    ],
  })
}

export async function fetchMessages(
  sessionKey: Hex,
  { limit, cursor }: { limit?: number; cursor?: string } = {},
) {
  const builder = publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", "agent_message"),
      eq("sessionId", sessionKey),
    ])
    .orderBy(asc("messageIndex", "number"))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)

  if (limit !== undefined) builder.limit(limit)
  if (cursor !== undefined) builder.cursor(cursor)

  return builder.fetch()
}

export async function fetchMessagesByRole(sessionKey: Hex, role: MessageRole) {
  return publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", "agent_message"),
      eq("sessionId", sessionKey),
      eq("role", role),
    ])
    .orderBy(asc("messageIndex", "number"))
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .fetch()
}

// Saves the assistant message and all its extracted insights in a single
// on-chain transaction via mutateEntities. Keeps the AI turn atomic.
export async function batchSaveAssistantTurn(
  walletClient: ConnectedWalletClient,
  {
    sessionKey,
    content,
    messageIndex,
    ttlDays,
    mode,
    insights,
  }: {
    sessionKey: Hex
    content: string
    messageIndex: number
    ttlDays: number
    mode: AgentMode
    insights: Array<{ category: string; summary: string }>
  },
) {
  const signer = createSigningClient(walletClient)
  const owner = walletClient.account.address as Hex

  const messageCreate = {
    payload: jsonToPayload({ role: "assistant", content, hasAttachment: false }),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "agent_message" },
      { key: "sessionId", value: sessionKey },
      { key: "owner", value: owner },
      { key: "messageIndex", value: messageIndex },
      { key: "role", value: "assistant" },
    ],
  }

  const insightCreates = insights.map((ins) => ({
    payload: jsonToPayload({
      summary: ins.summary,
      detail: ins.summary,
      sourceMessageIndex: String(messageIndex),
    }),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays * 2),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "agent_insight" },
      { key: "sessionId", value: sessionKey },
      { key: "owner", value: owner },
      { key: "category", value: ins.category },
      { key: "mode", value: mode },
      { key: "pinned", value: "true" },
    ],
  }))

  return signer.mutateEntities({
    creates: [messageCreate, ...insightCreates],
  })
}
