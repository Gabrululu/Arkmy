"use client"

import { useState } from "react"
import Link from "next/link"
import type { Entity } from "@arkiv-network/sdk"
import type { SessionPayload } from "@/lib/arkiv/sessions"
import { MODE_CONFIG } from "@/lib/ai/prompts"

const MODE_BADGE = {
  lex: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  bio: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  doc: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400",
}

interface SessionCardProps {
  session: Entity
  onArchive?: (session: Entity) => void
  onExtend?: (session: Entity) => void
}

export function SessionCard({ session, onArchive, onExtend }: SessionCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isEncrypted = session.attributes?.find((a) => a.key === "encrypted")?.value === "true"

  let title: string
  let mode: "lex" | "bio" | "doc"
  let createdAt: string

  if (isEncrypted) {
    mode = (session.attributes?.find((a) => a.key === "mode")?.value ?? "lex") as "lex" | "bio" | "doc"
    title = (session.attributes?.find((a) => a.key === "title")?.value as string | undefined) ?? "Encrypted session"
    createdAt = ""
  } else {
    let payload: SessionPayload | null = null
    try {
      payload = session.toJson() as SessionPayload
    } catch {
      return null
    }
    mode = payload.mode
    title = payload.title
    createdAt = new Date(payload.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const config = MODE_CONFIG[mode]

  return (
    <div className="p-4 border border-[#2a2a2a] bg-[#141414] hover:border-[#3d3d3d] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-xs font-mono font-medium ${MODE_BADGE[mode]}`}>
              {config.icon} {config.label}
            </span>
            {isEncrypted && (
              <span className="font-mono text-[10px] text-[#3d3d3d] border border-[#2a2a2a] px-1.5 py-0.5">
                🔒 encrypted
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-[#f0ede8] truncate">{title}</h3>
          {createdAt && <p className="text-xs text-[#3d3d3d] mt-0.5 font-mono">Created {createdAt}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onArchive && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { onArchive(session); setConfirmDelete(false) }}
                  className="text-xs text-[#e8442a] hover:text-[#ff5540] transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-[#3d3d3d] hover:text-[#6b6b6b] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-[#3d3d3d] hover:text-[#e8442a] transition-colors"
              >
                Delete
              </button>
            )
          )}
          {onExtend && (
            <button
              onClick={() => onExtend(session)}
              className="text-xs text-[#3d3d3d] hover:text-[#6b6b6b] transition-colors font-mono"
            >
              +Extend
            </button>
          )}
          <Link
            href={`/session/${session.key}`}
            className="px-3 py-1.5 text-xs font-medium border border-[#2a2a2a] hover:border-[#3d3d3d] text-[#f0ede8] transition-colors"
          >
            Open →
          </Link>
        </div>
      </div>
    </div>
  )
}
