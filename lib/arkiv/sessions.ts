import { eq } from "@arkiv-network/sdk/query"
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils"
import type { Hex } from "@arkiv-network/sdk"
import { publicClient, createSigningClient, PROJECT_ATTRIBUTE } from "./client"

export type AgentMode = "lex" | "bio" | "doc"

export type SessionPayload = {
  title: string
  mode: AgentMode
  createdAt: string
}

export async function createSession(
  walletClient: any,
  { title, mode, ttlDays }: { title: string; mode: AgentMode; ttlDays: number },
) {
  const signer = createSigningClient(walletClient)
  const owner = walletClient.account.address as Hex
  const payload: SessionPayload = { title, mode, createdAt: new Date().toISOString() }
  return signer.createEntity({
    payload: jsonToPayload(payload),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "agent_session" },
      { key: "owner", value: owner },
      { key: "mode", value: mode },
      { key: "status", value: "active" },
      { key: "ttlDays", value: String(ttlDays) },
    ],
  })
}

export async function fetchSessions(ownerAddress: Hex) {
  return publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", "agent_session"),
      eq("owner", ownerAddress),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .fetch()
}

export async function fetchSessionByKey(sessionKey: Hex) {
  return publicClient.getEntity(sessionKey)
}

export async function extendSession(walletClient: any, sessionKey: Hex, additionalDays: number) {
  const signer = createSigningClient(walletClient)
  return signer.extendEntity({
    entityKey: sessionKey,
    expiresIn: ExpirationTime.fromDays(additionalDays),
  })
}

export async function archiveSession(
  walletClient: any,
  sessionKey: Hex,
  currentPayload: SessionPayload,
  ttlDays: number,
) {
  const signer = createSigningClient(walletClient)
  const owner = walletClient.account.address as Hex
  return signer.updateEntity({
    entityKey: sessionKey,
    payload: jsonToPayload(currentPayload),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "agent_session" },
      { key: "owner", value: owner },
      { key: "mode", value: currentPayload.mode },
      { key: "status", value: "archived" },
      { key: "ttlDays", value: String(ttlDays) },
    ],
  })
}
