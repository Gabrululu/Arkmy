"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAccount, useWalletClient } from "wagmi"
import type { Hex } from "@arkiv-network/sdk"
import type { Entity } from "@arkiv-network/sdk"
import type { SessionPayload, AgentMode } from "@/lib/arkiv/sessions"
import { fetchSessions, archiveSession } from "@/lib/arkiv/sessions"
import { WalletConnect } from "@/components/WalletConnect"
import { SessionCard } from "@/components/SessionCard"
import { MODE_CONFIG } from "@/lib/ai/prompts"

const MODES: AgentMode[] = ["lex", "bio", "doc"]

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [mounted, setMounted] = useState(false)
  const [sessions, setSessions] = useState<Entity[]>([])
  const [titleFilter, setTitleFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!address) return
    setLoading(true)
    fetchSessions(address as Hex)
      .then((r) => setSessions(r.entities))
      .catch(() => setError("Failed to load sessions"))
      .finally(() => setLoading(false))
  }, [address])

  async function handleArchive(session: Entity) {
    if (!walletClient) return
    try {
      const payload = session.toJson() as SessionPayload
      const ttlAttr = session.attributes?.find((a) => a.key === "ttlDays")
      const ttlDays = ttlAttr ? parseInt(String(ttlAttr.value)) || 365 : 365
      await archiveSession(walletClient, session.key, payload, ttlDays)
      setSessions((prev) => prev.filter((s) => s.key !== session.key))
    } catch (err: any) {
      setError(err?.message ?? "Failed to archive session")
    }
  }

  if (!mounted || !isConnected) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
        {mounted && (
          <>
            <p className="text-[#6b6b6b] text-sm">Connect your wallet to access your sessions.</p>
            <WalletConnect />
            <Link href="/" className="font-mono text-xs text-[#3d3d3d] hover:text-[#6b6b6b] mt-2">
              ← Back to home
            </Link>
          </>
        )}
      </div>
    )
  }

  const filterLower = titleFilter.toLowerCase()
  const sessionsByMode = MODES.reduce(
    (acc, mode) => ({
      ...acc,
      [mode]: sessions.filter((s) => {
        try {
          const p = s.toJson() as SessionPayload
          return (
            p.mode === mode &&
            s.attributes?.find((a) => a.key === "status")?.value !== "archived" &&
            (filterLower === "" || p.title.toLowerCase().includes(filterLower))
          )
        } catch {
          return false
        }
      }),
    }),
    {} as Record<AgentMode, Entity[]>,
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f0ede8]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
        <Link href="/" className="font-mono font-bold text-sm tracking-[0.15em] uppercase text-[#f0ede8]">
          arkmy
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/session/new"
            className="px-3 py-1.5 text-xs font-medium border border-[#2a2a2a] hover:border-[#3d3d3d] text-[#f0ede8] transition-colors"
          >
            + New Session
          </Link>
          <WalletConnect />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#f0ede8]">Your Sessions</h1>
          <p className="font-mono text-xs text-[#3d3d3d] mt-1">
            {address?.slice(0, 8)}…{address?.slice(-6)}
          </p>
          <input
            type="text"
            placeholder="Filter by title…"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="mt-4 w-full max-w-xs bg-transparent border border-[#2a2a2a] px-3 py-1.5 font-mono text-xs text-[#f0ede8] placeholder-[#3d3d3d] focus:outline-none focus:border-[#3d3d3d]"
          />
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-[#e8442a]/5 border border-[#e8442a]/30 text-sm text-[#e8442a]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODES.map((mode) => {
            const config = MODE_CONFIG[mode]
            const modeSessions = sessionsByMode[mode] ?? []
            return (
              <div key={mode} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{config.icon}</span>
                    <span className="text-sm font-medium text-[#f0ede8]">{config.label}</span>
                    {modeSessions.length > 0 && (
                      <span className="font-mono text-xs text-[#3d3d3d]">({modeSessions.length})</span>
                    )}
                  </div>
                  <Link
                    href={`/session/new?mode=${mode}`}
                    className="font-mono text-xs text-[#3d3d3d] hover:text-[#6b6b6b] transition-colors"
                  >
                    + New
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 bg-[#141414] border border-[#1a1a1a] animate-pulse" />
                    ))}
                  </div>
                ) : modeSessions.length === 0 ? (
                  <Link
                    href={`/session/new?mode=${mode}`}
                    className="flex flex-col items-center justify-center p-6 border border-dashed border-[#2a2a2a] hover:border-[#3d3d3d] transition-colors text-center"
                  >
                    <span className="text-2xl mb-2">{config.icon}</span>
                    <span className="font-mono text-xs text-[#3d3d3d]">Start a {config.label} session</span>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {modeSessions.map((s) => (
                      <SessionCard key={s.key} session={s} onArchive={handleArchive} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
