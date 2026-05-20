import { eq, lte } from "@arkiv-network/sdk/query"
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils"
import type { Hex, Entity } from "@arkiv-network/sdk"
import { publicClient, createSigningClient, PROJECT_ATTRIBUTE, type ConnectedWalletClient } from "./client"
import { encryptEnvelope, decryptEnvelope, type EncryptedEnvelope } from "@/lib/crypto"

export type AgentMode = "lex" | "bio" | "doc"

export type SessionPayload = {
  title: string
  mode: AgentMode
  createdAt: string
}

export async function createSession(
  walletClient: ConnectedWalletClient,
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
      { key: "ttlDays", value: ttlDays },
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

export async function extendSession(walletClient: ConnectedWalletClient, sessionKey: Hex, additionalDays: number) {
  const signer = createSigningClient(walletClient)
  return signer.extendEntity({
    entityKey: sessionKey,
    expiresIn: ExpirationTime.fromDays(additionalDays),
  })
}

export async function archiveSession(
  walletClient: ConnectedWalletClient,
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
      { key: "ttlDays", value: ttlDays },
    ],
  })
}

// Creates a session whose payload is envelope-encrypted on-chain.
// The plaintext never leaves the browser in clear form; only the ciphertext is stored.
export async function createEncryptedSession(
  walletClient: ConnectedWalletClient,
  { title, mode, ttlDays }: { title: string; mode: AgentMode; ttlDays: number },
) {
  const signer = createSigningClient(walletClient)
  const owner = walletClient.account.address as Hex
  const plaintext = JSON.stringify({ title, mode, createdAt: new Date().toISOString() })
  const envelope = await encryptEnvelope(walletClient, plaintext)

  return signer.createEntity({
    payload: new TextEncoder().encode(JSON.stringify(envelope)),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "agent_session" },
      { key: "owner", value: owner },
      { key: "mode", value: mode },
      { key: "status", value: "active" },
      { key: "ttlDays", value: ttlDays },
      { key: "encrypted", value: "true" },
    ],
  })
}

// Decrypts an encrypted session's payload back to SessionPayload.
// Requires the owner's wallet to re-derive the KEK.
export async function decryptSessionPayload(
  walletClient: ConnectedWalletClient,
  session: Entity,
): Promise<SessionPayload> {
  if (!session.payload) throw new Error("Session has no payload")
  const envelope: EncryptedEnvelope = JSON.parse(new TextDecoder().decode(session.payload))
  const plaintext = await decryptEnvelope(walletClient, envelope)
  return JSON.parse(plaintext) as SessionPayload
}

export async function fetchExpiringSessions(ownerAddress: Hex, maxDays: number) {
  return publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", "agent_session"),
      eq("owner", ownerAddress),
      lte("ttlDays", maxDays),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .fetch()
}
