"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAccount } from "wagmi"
import type { Hex } from "@arkiv-network/sdk"
import type { AgentMode, SessionPayload } from "@/lib/arkiv/sessions"
import type { MessagePayload } from "@/lib/arkiv/messages"
import { fetchSessionByKey } from "@/lib/arkiv/sessions"
import { fetchMessages } from "@/lib/arkiv/messages"
import { checkDelegateAccess } from "@/lib/arkiv/delegates"
import { ChatInterface } from "@/components/ChatInterface"
import { DelegateManager } from "@/components/DelegateManager"
import { WalletConnect } from "@/components/WalletConnect"
import { MODE_CONFIG } from "@/lib/ai/prompts"

const MODE_ACCENT = {
  lex: "text-amber-400",
  bio: "text-emerald-400",
  doc: "text-indigo-400",
}

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as Hex
  const { address, isConnected } = useAccount()

  const [sessionData, setSessionData] = useState<SessionPayload | null>(null)
  const [ttlDays, setTtlDays] = useState(365)
  const [messages, setMessages] = useState<Array<{ payload: MessagePayload; index: number }>>([])
  const [isOwner, setIsOwner] = useState(false)
  const [canAccess, setCanAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDelegates, setShowDelegates] = useState(false)

  useEffect(() => {
    if (!sessionId || !address) return

    async function loadSession() {
      setLoading(true)
      setError(null)
      try {
        const session = await fetchSessionByKey(sessionId)
        const isEncrypted = session.attributes?.find((a) => a.key === "encrypted")?.value === "true"
        let payload: SessionPayload
        if (isEncrypted) {
          const modeAttr = session.attributes?.find((a) => a.key === "mode")?.value as AgentMode | undefined
          const titleAttr = session.attributes?.find((a) => a.key === "title")?.value as string | undefined
          payload = { title: titleAttr ?? "Encrypted session", mode: modeAttr ?? "lex", createdAt: "" }
        } else {
          payload = session.toJson() as SessionPayload
        }
        setSessionData(payload)

        const ownerAttr = session.attributes?.find((a) => a.key === "owner")
        const ownerAddr = ownerAttr?.value as string | undefined
        const isOwnerCheck = ownerAddr?.toLowerCase() === address?.toLowerCase()
        setIsOwner(isOwnerCheck)

        const ttlAttr = session.attributes?.find((a) => a.key === "ttlDays")
        setTtlDays(ttlAttr ? parseInt(String(ttlAttr.value)) || 365 : 365)

        if (!isOwnerCheck) {
          const hasAccess = await checkDelegateAccess(sessionId, address as Hex)
          if (!hasAccess) {
            setError("You don't have access to this session")
            setLoading(false)
            return
          }
        }
        setCanAccess(true)

        const msgsResult = await fetchMessages(sessionId)
        const sortedMsgs = msgsResult.entities
          .map((e) => {
            try {
              const indexAttr = e.attributes?.find((a) => a.key === "messageIndex")
              return {
                payload: e.toJson() as MessagePayload,
                index: parseInt(String(indexAttr?.value ?? 0)),
              }
            } catch {
              return null
            }
          })
          .filter(Boolean) as Array<{ payload: MessagePayload; index: number }>
        setMessages(sortedMsgs)
      } catch (err: any) {
        setError(err?.message ?? "Failed to load session")
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId, address])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#6b6b6b]">Connect your wallet to access this session</p>
        <WalletConnect />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-sm text-[#6b6b6b]">Loading session from Arkiv...</div>
      </div>
    )
  }

  if (error || !sessionData || !canAccess) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#e8442a]">{error ?? "Session not found"}</p>
        <Link href="/dashboard" className="text-xs text-[#6b6b6b] hover:text-[#f0ede8]">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const config = MODE_CONFIG[sessionData.mode]
  const accentText = MODE_ACCENT[sessionData.mode]

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xs text-[#6b6b6b] hover:text-[#f0ede8]">
            ← Dashboard
          </Link>
          <span className="text-[#1a1a1a]">|</span>
          <span className="text-sm text-[#f0ede8] truncate max-w-xs">{sessionData.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setShowDelegates(!showDelegates)}
              className="px-3 py-1.5 text-xs border border-[#2a2a2a] hover:border-[#6b6b6b] text-[#6b6b6b] transition-colors"
            >
              Share
            </button>
          )}
          <Link
            href={`/session/${sessionId}/insights`}
            className="px-3 py-1.5 text-xs border border-[#2a2a2a] hover:border-[#6b6b6b] text-[#6b6b6b] transition-colors"
          >
            Insights
          </Link>
          <WalletConnect />
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface
            sessionKey={sessionId}
            sessionData={sessionData}
            ttlDays={ttlDays}
            initialMessages={messages}
          />
        </div>

        {/* Sidebar */}
        {showDelegates && (
          <div className="w-72 border-l border-[#1a1a1a] bg-[#0f0f0f] p-4 flex-shrink-0 overflow-y-auto">
            <DelegateManager sessionKey={sessionId} isOwner={isOwner} />
          </div>
        )}
      </div>
    </div>
  )
}
