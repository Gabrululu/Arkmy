import { createPublicClient, createWalletClient, http, custom } from "@arkiv-network/sdk"
import { braga } from "@arkiv-network/sdk/chains"

export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "arkmy-confidential-agents-4z8w",
} as const

export const BRAGA_RPC = "https://braga.hoodi.arkiv.network/rpc"

export const publicClient = createPublicClient({
  chain: braga,
  transport: http(BRAGA_RPC),
})

export function createSigningClient(viemWalletClient: any) {
  if (!viemWalletClient.account) {
    throw new Error("WalletClient has no account")
  }
  return createWalletClient({
    chain: braga,
    transport: custom(viemWalletClient.transport),
    account: viemWalletClient.account,
  })
}
