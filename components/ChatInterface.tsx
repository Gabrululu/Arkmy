"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useConnection, useWalletClient } from "wagmi"
import type { Hex } from "@arkiv-network/sdk"
import type { Entity } from "@arkiv-network/sdk"
import type { AgentMode, SessionPayload } from "@/lib/arkiv/sessions"
import type { MessagePayload } from "@/lib/arkiv/messages"
import { saveMessage, batchSaveAssistantTurn } from "@/lib/arkiv/messages"
import { MODE_CONFIG, parseInsights, stripInsightTags } from "@/lib/ai/prompts"
import { MessageBubble } from "./MessageBubble"
import { FileUpload } from "./FileUpload"
import { InsightCard } from "./InsightCard"

const MODE_ACCENT_CLASSES = {
  lex: { border: "border-amber-500/30",   badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",   ring: "focus:border-amber-500/50" },
  bio: { border: "border-emerald-500/30", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", ring: "focus:border-emerald-500/50" },
  doc: { border: "border-indigo-500/30",  badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",  ring: "focus:border-indigo-500/50" },
}

interface LocalMessage {
  role: "user" | "assistant"
  content: string
  hasAttachment?: boolean
  fileName?: string
}

interface ChatInterfaceProps {
  sessionKey: Hex
  sessionData: SessionPayload
  ttlDays: number
  initialMessages: Array<{ payload: MessagePayload; index: number }>
}

export function ChatInterface({ sessionKey, sessionData, ttlDays, initialMessages }: ChatInterfaceProps) {
  const { address } = useConnection()
  const { data: walletClient } = useWalletClient()
  const mode = sessionData.mode
  const config = MODE_CONFIG[mode]
  const accent = MODE_ACCENT_CLASSES[mode]

  const [messages, setMessages] = useState<LocalMessage[]>(
    initialMessages
      .sort((a, b) => a.index - b.index)
      .map((m) => ({
        role: m.payload.role,
        content: m.payload.content,
        hasAttachment: m.payload.hasAttachment,
        fileName: m.payload.fileName,
      })),
  )
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [pendingFile, setPendingFile] = useState<{ text: string; name: string; wasTruncated?: boolean } | null>(null)
  const [recentInsights, setRecentInsights] = useState<Array<{ category: string; summary: string }>>([])
  const [savingToChain, setSavingToChain] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chainWarning, setChainWarning] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  const handleSend = useCallback(async () => {
    if (!input.trim() && !pendingFile) return
    if (!walletClient || !address) {
      setError("Connect your wallet to send messages")
      return
    }
    if (isStreaming) return

    setError(null)
    const messageIndex = messages.length

    let userContent = input.trim()
    let hasAttachment = false
    let fileName: string | undefined

    if (pendingFile) {
      userContent = `I'm sharing the following document for your analysis:\n\n[${pendingFile.name}]\n\n${pendingFile.text}\n\n${userContent ? `\n${userContent}` : "Please analyze it."}`
      hasAttachment = true
      fileName = pendingFile.name
      setPendingFile(null)
    }

    const userMsg: LocalMessage = { role: "user", content: userContent, hasAttachment, fileName }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput("")

    // Save user message to Arkiv
    setSavingToChain(true)
    try {
      await saveMessage(walletClient, {
        sessionKey,
        role: "user",
        content: userContent,
        messageIndex,
        ttlDays,
        hasAttachment,
        fileName,
      })
    } catch (err) {
      console.error("Failed to save user message to Arkiv:", err)
      setChainWarning("Message sent but couldn't be saved on-chain — check your wallet and GLM balance.")
    } finally {
      setSavingToChain(false)
    }

    // Stream AI response
    setIsStreaming(true)
    let assistantContent = ""
    const assistantIndex = messageIndex + 1
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, mode, ownerAddress: address }),
      })

      if (!res.ok || !res.body) {
        throw new Error("Failed to get AI response")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              assistantContent += parsed.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: "assistant", content: assistantContent }
                return updated
              })
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to get response")
      setIsStreaming(false)
      return
    }

    setIsStreaming(false)

    // Parse insights from response
    const insights = parseInsights(assistantContent)
    const cleanContent = stripInsightTags(assistantContent)

    setMessages((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = { role: "assistant", content: cleanContent }
      return updated
    })

    if (insights.length > 0) {
      setRecentInsights(insights)
    }

    // Save assistant message + insights atomically via mutateEntities
    setSavingToChain(true)
    try {
      await batchSaveAssistantTurn(walletClient, {
        sessionKey,
        content: cleanContent,
        messageIndex: assistantIndex,
        ttlDays,
        mode,
        insights,
      })
    } catch (err) {
      console.error("Failed to save assistant turn to Arkiv:", err)
      setChainWarning("Response received but couldn't be saved on-chain — check your wallet and GLM balance.")
    } finally {
      setSavingToChain(false)
    }
  }, [input, pendingFile, messages, walletClient, address, isStreaming, sessionKey, mode, ttlDays])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mode badge */}
      <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-mono font-medium ${accent.badge}`}>
          {config.icon} {config.name}
        </span>
        {savingToChain && (
          <span className="font-mono text-[11px] text-[#3d3d3d] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#3d3d3d] animate-pulse" />
            Saving to Arkiv…
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="text-4xl">{config.icon}</div>
            <p className="text-[#6b6b6b] text-sm max-w-xs">
              {config.description}. All messages are stored on-chain under your wallet.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            hasAttachment={msg.hasAttachment}
            fileName={msg.fileName}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Recent insights */}
      {recentInsights.length > 0 && (
        <div className="px-4 py-2 border-t border-[#2a2a2a] space-y-1.5">
          <p className="font-mono text-[11px] text-[#3d3d3d]">Pinned to Arkiv:</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {recentInsights.map((ins, i) => (
              <InsightCard key={i} category={ins.category} summary={ins.summary} compact />
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 border-t border-[#2a2a2a] space-y-2">
        {chainWarning && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span className="flex-1">{chainWarning}</span>
            <button onClick={() => setChainWarning(null)} className="flex-shrink-0 text-amber-400/60 hover:text-amber-400">✕</button>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-[#e8442a]/5 border border-[#e8442a]/30 text-xs text-[#e8442a]">
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {pendingFile && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a]">
              <svg className="w-3.5 h-3.5 text-[#6b6b6b] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-mono text-[#f0ede8] flex-1 truncate">{pendingFile.name}</span>
              <button onClick={() => setPendingFile(null)} className="text-[#3d3d3d] hover:text-[#6b6b6b] text-xs">✕</button>
            </div>
            {pendingFile.wasTruncated && (
              <p className="font-mono text-[10px] text-amber-500/70 px-1">
                File truncated to 80,000 characters to fit model context.
              </p>
            )}
          </div>
        )}

        <FileUpload
          onFileExtracted={(text, name, wasTruncated) => {
            setPendingFile({ text, name, wasTruncated })
          }}
          onError={setError}
          disabled={isStreaming}
        />

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${config.name}...`}
            rows={2}
            disabled={isStreaming}
            className={`flex-1 px-3 py-2.5 text-sm bg-[#141414] border text-[#f0ede8] placeholder-[#3d3d3d] focus:outline-none resize-none transition-colors ${accent.border} ${accent.ring} disabled:opacity-50`}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || (!input.trim() && !pendingFile)}
            className="px-4 py-2 text-sm font-semibold bg-[#e8442a] hover:bg-[#ff5540] disabled:opacity-40 disabled:cursor-not-allowed text-[#0f0f0f] transition-colors self-end"
          >
            {isStreaming ? "..." : "Send"}
          </button>
        </div>
        <p className="font-mono text-[10px] text-[#3d3d3d] px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
