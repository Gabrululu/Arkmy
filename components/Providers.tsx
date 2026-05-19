"use client"

import { useEffect, useState } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { wagmiConfig } from "@/lib/wagmi/config"

// Suppress unhandled MetaMask "Failed to connect" rejections that occur when
// the extension's Manifest V3 service worker is sleeping on page load.
// These are MetaMask-internal errors, not app bugs.
function useMetaMaskErrorSuppressor() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg: string = event.reason?.message ?? ""
      if (
        msg.includes("Failed to connect to MetaMask") ||
        msg.includes("MetaMask extension not found") ||
        msg.includes("Could not establish connection")
      ) {
        event.preventDefault()
      }
    }
    window.addEventListener("unhandledrejection", handler)
    return () => window.removeEventListener("unhandledrejection", handler)
  }, [])
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 0 },
          mutations: { retry: 0 },
        },
      })
  )

  useMetaMaskErrorSuppressor()

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
