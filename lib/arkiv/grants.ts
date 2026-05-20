import { eq } from "@arkiv-network/sdk/query"
import { ExpirationTime } from "@arkiv-network/sdk/utils"
import type { Hex } from "@arkiv-network/sdk"
import { publicClient, createSigningClient, PROJECT_ATTRIBUTE, type ConnectedWalletClient } from "./client"

// AccessGrant: an on-chain entity that authorizes a delegate to access a specific session.
// When the entity's TTL expires it is automatically purged from the chain → access auto-revokes.
// Early revocation is possible via revokeAccessGrant (deleteEntity).

export async function createAccessGrant(
  walletClient: ConnectedWalletClient,
  {
    sessionKey,
    delegateAddress,
    ttlDays,
  }: {
    sessionKey: Hex
    delegateAddress: Hex
    ttlDays: number
  },
) {
  const signer = createSigningClient(walletClient)
  const owner = walletClient.account.address as Hex
  return signer.createEntity({
    payload: new Uint8Array(0),
    contentType: "application/json",
    expiresIn: ExpirationTime.fromDays(ttlDays),
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: "access_grant" },
      { key: "sessionId", value: sessionKey },
      { key: "owner", value: owner },
      { key: "delegate", value: delegateAddress },
      { key: "ttlDays", value: ttlDays },
    ],
  })
}

// Immediately revokes an AccessGrant before its natural expiry.
export async function revokeAccessGrant(walletClient: ConnectedWalletClient, grantKey: Hex) {
  const signer = createSigningClient(walletClient)
  return signer.deleteEntity({ entityKey: grantKey })
}

// Returns all active (non-expired) AccessGrants for a session.
export async function fetchActiveGrants(sessionKey: Hex) {
  return publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", "access_grant"),
      eq("sessionId", sessionKey),
    ])
    .withAttributes(true)
    .withMetadata(true)
    .fetch()
}

// Returns true if an active grant exists for the given delegate on this session.
export async function hasActiveGrant(sessionKey: Hex, delegateAddress: Hex): Promise<boolean> {
  const result = await publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", "access_grant"),
      eq("sessionId", sessionKey),
      eq("delegate", delegateAddress),
    ])
    .withAttributes(true)
    .fetch()
  return result.entities.length > 0
}
