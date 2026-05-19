"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAccount, useWalletClient, useChainId, useSwitchChain } from "wagmi"
import type { AgentMode } from "@/lib/arkiv/sessions"
import { createSession } from "@/lib/arkiv/sessions"
import { MODE_CONFIG } from "@/lib/ai/prompts"
import { ModeSelector } from "@/components/ModeSelector"
import { TTLPicker } from "@/components/TTLPicker"
import { WalletConnect } from "@/components/WalletConnect"
import { bragaChain } from "@/lib/wagmi/config"

function NewSessionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const presetMode = searchParams.get("mode") as AgentMode | null
  const [step, setStep] = useState<1 | 2>(presetMode ? 2 : 1)
  const [mode, setMode] = useState<AgentMode | null>(presetMode)
  const [title, setTitle] = useState("")
  const [ttlDays, setTtlDays] = useState(365)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode) setTtlDays(MODE_CONFIG[mode].defaultTtlDays)
  }, [mode])

  async function handleCreate() {
    setError(null)

    if (!walletClient) {
      setError("Wallet client not ready — make sure MetaMask is unlocked and on the Braga network.")
      return
    }
    if (!mode || !title.trim()) return

    setCreating(true)
    try {
      const { entityKey } = await createSession(walletClient, {
        title: title.trim(),
        mode,
        ttlDays,
      })
      router.push(`/session/${entityKey}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)

      // Common failure patterns → human-readable hints
      if (msg.includes("insufficient funds") || msg.includes("gas")) {
        setError("Not enough GLM for gas. Get testnet tokens from braga.hoodi.arkiv.network/faucet/")
      } else if (msg.includes("rejected") || msg.includes("denied") || msg.includes("4001")) {
        setError("Transaction rejected in MetaMask.")
      } else if (msg.includes("chain") || msg.includes("network")) {
        setError("Wrong network — switch MetaMask to Braga testnet (chain 60138453102).")
      } else {
        setError(msg || "Failed to create session")
      }
      setCreating(false)
    }
  }

  // ── Not connected ──────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-[#6b6b6b]">Connect your wallet to create a session.</p>
        <WalletConnect />
      </div>
    )
  }

  // ── Wrong chain ────────────────────────────────────────────────
  if (chainId !== bragaChain.id) {
    return (
      <div className="flex flex-col items-center gap-5 text-center max-w-md mx-auto">
        <div className="border border-amber-500/20 bg-amber-500/5 px-6 py-5 w-full">
          <p className="font-mono text-xs text-amber-400 tracking-widest uppercase mb-2">
            Wrong network
          </p>
          <p className="text-sm text-[#6b6b6b] mb-5">
            Arkmy writes to the <strong className="text-[#f0ede8]">Braga testnet</strong>.
            Switch your wallet to continue.
          </p>
          <button
            onClick={() => switchChain({ chainId: bragaChain.id })}
            disabled={isSwitching}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            {isSwitching ? "Switching…" : "Switch to Braga testnet"}
          </button>
        </div>
        <p className="font-mono text-[11px] text-[#3d3d3d]">
          Chain ID: 60138453102 · RPC: braga.hoodi.arkiv.network/rpc
        </p>
        <a
          href="https://braga.hoodi.arkiv.network/faucet/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-[#3d9e4a] hover:underline"
        >
          Get GLM testnet tokens from faucet ↗
        </a>
      </div>
    )
  }

  // ── Step 1: choose mode ────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#f0ede8] mb-1">Choose your agent</h2>
          <p className="text-sm text-[#6b6b6b]">Select the mode that fits your task.</p>
        </div>
        <ModeSelector selected={mode} onSelect={(m) => { setMode(m); setStep(2) }} />
      </div>
    )
  }

  // ── Step 2: configure + create ─────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#f0ede8] mb-1">Configure your session</h2>
        <p className="text-sm text-[#6b6b6b]">Name it and set how long it lives on-chain.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-[#a3a3a3] mb-2 block">Session name</label>
          <input
            type="text"
            placeholder={`e.g. "Q2 Employment Contract Review"`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && title.trim() && handleCreate()}
            className="w-full px-4 py-3 text-sm bg-[#141414] border border-[#2a2a2a] text-[#f0ede8] placeholder-[#3d3d3d] focus:outline-none focus:border-[#3d3d3d]"
          />
        </div>

        <div>
          <label className="text-sm text-[#a3a3a3] mb-2 block">Expiration (TTL)</label>
          {mode && <TTLPicker mode={mode} value={ttlDays} onChange={setTtlDays} />}
        </div>
      </div>

      {/* Faucet hint — shown proactively */}
      <div className="flex items-start gap-2 text-[11px] font-mono text-[#3d3d3d]">
        <span>ℹ</span>
        <span>
          You need GLM on Braga testnet to sign this write.{" "}
          <a
            href="https://braga.hoodi.arkiv.network/faucet/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3d9e4a] hover:underline"
          >
            Get free tokens ↗
          </a>
        </span>
      </div>

      {error && (
        <div className="border border-[#e8442a]/30 bg-[#e8442a]/5 px-4 py-3 font-mono text-xs text-[#e8442a]">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => { setStep(1); setError(null) }}
          className="px-4 py-2.5 text-sm border border-[#2a2a2a] hover:border-[#3d3d3d] text-[#6b6b6b] transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleCreate}
          disabled={!title.trim() || creating || !walletClient}
          className="flex-1 px-4 py-2.5 text-sm font-semibold bg-[#e8442a] hover:bg-[#ff5540] disabled:opacity-40 disabled:cursor-not-allowed text-[#0f0f0f] transition-colors"
        >
          {creating ? "Writing to Arkiv…" : "Create Session"}
        </button>
      </div>

      {!walletClient && (
        <p className="font-mono text-[11px] text-amber-400/80 text-center">
          Waiting for wallet client… unlock MetaMask if prompted.
        </p>
      )}
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f0ede8]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
        <Link href="/dashboard" className="font-mono font-bold text-sm tracking-[0.15em] uppercase text-[#f0ede8]">
          arkmy
        </Link>
        <WalletConnect />
      </nav>
      <main className="px-6 py-12">
        <Suspense>
          <NewSessionForm />
        </Suspense>
      </main>
    </div>
  )
}
