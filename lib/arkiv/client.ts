import { createPublicClient, createWalletClient, http, custom } from "@arkiv-network/sdk"
import { braga } from "@arkiv-network/sdk/chains"
import type { Account, Chain, Transport, WalletClient } from "viem"

export type ConnectedWalletClient = WalletClient<Transport, Chain | undefined, Account>

export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "arkmy-confidential-agents-4z8w",
} as const

export const BRAGA_RPC = "https://braga.hoodi.arkiv.network/rpc"

export const publicClient = createPublicClient({
  chain: braga,
  transport: http(BRAGA_RPC, { timeout: 30_000, retryCount: 3, retryDelay: 1_000 }),
})

export function createSigningClient(viemWalletClient: ConnectedWalletClient) {
  if (!viemWalletClient.account) {
    throw new Error("WalletClient has no account")
  }
  return createWalletClient({
    chain: braga,
    transport: custom(viemWalletClient.transport),
    account: viemWalletClient.account,
  })
}
