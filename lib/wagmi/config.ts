"use client"

import { createConfig, http } from "wagmi"
import { mainnet } from "wagmi/chains"
import { injected } from "wagmi/connectors"
import { BRAGA_RPC } from "@/lib/arkiv/client"

// Braga is the current Arkiv testnet (Kaolin was removed May 15, 2026)
const bragaChain = {
  id: 60138453102,
  name: "Braga Testnet",
  nativeCurrency: { name: "Golem", symbol: "GLM", decimals: 18 },
  rpcUrls: {
    default: { http: [BRAGA_RPC] },
  },
  testnet: true,
} as const

export const wagmiConfig = createConfig({
  chains: [bragaChain, mainnet],
  // Only injected() — covers MetaMask, Rabby, Coinbase, etc.
  // metaMask() connector removed: its SDK throws unhandled rejections when the
  // service worker is sleeping (Manifest V3 issue), causing "Error restoring session".
  connectors: [injected()],
  transports: {
    [bragaChain.id]: http(BRAGA_RPC),
    [mainnet.id]: http(),
  },
})

export { bragaChain }
