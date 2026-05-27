"use client"

import { useState, useEffect } from "react"
import type { Hex } from "@arkiv-network/sdk"
import type { Entity } from "@arkiv-network/sdk"
import { fetchDelegates, createDelegate } from "@/lib/arkiv/delegates"
import { useConnection, useWalletClient } from "wagmi"

const TTL_OPTIONS = [7, 30, 90] as const

interface DelegateManagerProps {
  sessionKey: Hex
  isOwner: boolean
}

export function DelegateManager({ sessionKey, isOwner }: DelegateManagerProps) {
  const { address } = useConnection()
  const { data: walletClient } = useWalletClient()
  const [delegates, setDelegates] = useState<Entity[]>([])
  const [newDelegate, setNewDelegate] = useState("")
  const [ttlDays, setTtlDays] = useState<7 | 30 | 90>(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchDelegates(sessionKey).then((r) => setDelegates(r.entities)).catch(() => {})
  }, [sessionKey])

  async function handleGrant() {
    if (!walletClient || !newDelegate.startsWith("0x")) {
      setError("Enter a valid wallet address (0x...)")
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await createDelegate(walletClient, { sessionKey, delegateAddress: newDelegate as Hex, ttlDays })
      setSuccess(true)
      setNewDelegate("")
      const updated = await fetchDelegates(sessionKey)
      setDelegates(updated.entities)
    } catch (err: any) {
      setError(err?.message ?? "Failed to grant access")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-[#3d3d3d]">Shared Access</p>

      {delegates.length > 0 && (
        <div className="space-y-1.5">
          {delegates.map((d) => {
            const addr = d.attributes?.find((a) => a.key === "delegate")?.value
            return (
              <div key={d.key} className="flex items-center justify-between px-3 py-2 border border-[#2a2a2a] bg-[#141414]">
                <span className="text-xs font-mono text-[#f0ede8]">
                  {addr ? `${String(addr).slice(0, 8)}…${String(addr).slice(-6)}` : "Unknown"}
                </span>
                <span className="font-mono text-[10px] text-[#3d3d3d]">read-only</span>
              </div>
            )
          })}
        </div>
      )}

      {isOwner && (
        <div className="space-y-3 pt-3 border-t border-[#1a1a1a]">
          <p className="text-xs text-[#6b6b6b]">Grant read access to another wallet</p>
          <input
            type="text"
            placeholder="0x... wallet address"
            value={newDelegate}
            onChange={(e) => setNewDelegate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#141414] border border-[#2a2a2a] text-[#f0ede8] placeholder-[#3d3d3d] focus:outline-none focus:border-[#3d3d3d] font-mono"
          />
          <div className="flex gap-2">
            {TTL_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setTtlDays(d)}
                className={`flex-1 py-1.5 text-xs border transition-colors font-mono ${
                  ttlDays === d
                    ? "border-[#f0ede8] bg-[#1a1a1a] text-[#f0ede8]"
                    : "border-[#2a2a2a] text-[#6b6b6b] hover:border-[#3d3d3d]"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          {error && (
            <p className="text-xs font-mono text-[#e8442a]">{error}</p>
          )}
          {success && (
            <p className="text-xs font-mono text-[#3d9e4a]">Access granted. Expires in {ttlDays} days.</p>
          )}
          <button
            onClick={handleGrant}
            disabled={loading || !newDelegate}
            className="btn-primary w-full py-2 text-sm justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Granting…" : "Grant Access"}
          </button>
        </div>
      )}
    </div>
  )
}
