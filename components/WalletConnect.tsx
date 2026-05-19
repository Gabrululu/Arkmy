"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi"
import { bragaChain } from "@/lib/wagmi/config"

export function WalletConnect() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR placeholder — matches client dimensions to avoid layout shift
  if (!mounted) {
    return <div className="h-9 w-28 bg-[#1a1a1a] animate-pulse" suppressHydrationWarning />
  }

  // --- Not connected ---
  if (!isConnected) {
    const injectedConnector = connectors.find((c) => c.id === "injected") ?? connectors[0]
    // Check for any injected wallet (MetaMask, Rabby, Coinbase, etc.)
    const hasWallet =
      typeof window !== "undefined" && typeof (window as { ethereum?: unknown }).ethereum !== "undefined"

    const handleConnect = () => {
      if (!injectedConnector || !hasWallet) return
      connect({ connector: injectedConnector })
    }

    // Friendly error message — MetaMask service worker issues show up here
    const errorMsg = error
      ? error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("not installed") ||
        error.message.toLowerCase().includes("service worker")
        ? "Reload MetaMask, then retry"
        : "Connection failed — retry"
      : null

    return (
      <div className="flex flex-col items-end gap-1.5">
        <button
          onClick={handleConnect}
          disabled={isPending}
          className={[
            "px-4 py-2 text-sm font-medium border transition-colors",
            isPending
              ? "bg-[#1a1a1a] text-[#6b6b6b] border-[#2a2a2a] cursor-wait"
              : !hasWallet
              ? "bg-[#1a1a1a] text-[#3d3d3d] border-[#2a2a2a] cursor-not-allowed"
              : "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#f0ede8] border-[#2a2a2a] hover:border-[#3d3d3d] cursor-pointer",
          ].join(" ")}
        >
          {isPending ? "Connecting…" : !hasWallet ? "No wallet found" : "Connect Wallet"}
        </button>

        {!hasWallet && (
          <span className="font-mono text-[10px] text-[#3d3d3d]">
            Install MetaMask to continue
          </span>
        )}

        {errorMsg && (
          <span className="font-mono text-[10px] text-[#e8442a] max-w-[180px] text-right">
            {errorMsg}
          </span>
        )}
      </div>
    )
  }

  // --- Wrong chain ---
  if (chainId !== bragaChain.id) {
    return (
      <button
        onClick={() => switchChain({ chainId: bragaChain.id })}
        className="px-4 py-2 text-sm font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
      >
        Switch to Braga
      </button>
    )
  }

  // --- Connected + correct chain ---
  return (
    <button
      onClick={() => disconnect()}
      className="px-4 py-2 text-sm font-mono bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#6b6b6b] border border-[#2a2a2a] transition-colors"
      title={address}
    >
      {address?.slice(0, 6)}…{address?.slice(-4)}
    </button>
  )
}
