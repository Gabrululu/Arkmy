import { eq } from "@arkiv-network/sdk/query"
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils"
import type { Hex } from "@arkiv-network/sdk"
import { publicClient, createSigningClient, PROJECT_ATTRIBUTE, type ConnectedWalletClient } from "./client"
import { withRetry } from "./retry"

export async function createDelegate(
  walletClient: ConnectedWalletClient,
  {
    sessionKey,
    delegateAddress,
    ttlDays,
  }: {
    sessionKey: Hex
    delegateAddress: Hex
    ttlDays: 7 | 30 | 90
  },
) {
  const signer = createSigningClient(walletClient)
  const owner = walletClient.account.address as Hex
  return signer.createEntity({
    payload: jsonToPayload({}),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "agent_delegate" },
      { key: "sessionId", value: sessionKey },
      { key: "owner", value: owner },
      { key: "delegate", value: delegateAddress },
      { key: "permission", value: "read" },
    ],
  })
}

export function fetchDelegates(sessionKey: Hex) {
  return withRetry(() =>
    publicClient
      .buildQuery()
      .where([
        eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
        eq("type", "agent_delegate"),
        eq("sessionId", sessionKey),
        eq("permission", "read"),
      ])
      .withAttributes(true)
      .withMetadata(true)
      .fetch()
  )
}

export async function checkDelegateAccess(sessionKey: Hex, walletAddress: Hex) {
  const result = await withRetry(() =>
    publicClient
      .buildQuery()
      .where([
        eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
        eq("type", "agent_delegate"),
        eq("sessionId", sessionKey),
        eq("delegate", walletAddress),
      ])
      .withAttributes(true)
      .fetch()
  )
  return result.entities.length > 0
}
