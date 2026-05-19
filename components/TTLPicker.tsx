"use client"

import { useState } from "react"
import type { AgentMode } from "@/lib/arkiv/sessions"
import { MODE_CONFIG } from "@/lib/ai/prompts"

interface TTLPickerProps {
  mode: AgentMode
  value: number
  onChange: (days: number) => void
}

function formatTTL(days: number): string {
  if (days < 1)   return `${Math.round(days * 24)}h`
  if (days < 7)   return `${days}d`
  if (days < 30)  return `${Math.round(days / 7)}w`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}yr`
}

function formatExpiryDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function TTLPicker({ mode, value, onChange }: TTLPickerProps) {
  const [customMode, setCustomMode] = useState(false)
  const presets = MODE_CONFIG[mode].ttlPresets

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => { onChange(preset); setCustomMode(false) }}
            className={`px-3 py-1.5 text-sm border transition-colors ${
              value === preset && !customMode
                ? "border-[#f0ede8] bg-[#1a1a1a] text-[#f0ede8]"
                : "border-[#2a2a2a] bg-[#141414] text-[#6b6b6b] hover:border-[#3d3d3d]"
            }`}
          >
            {formatTTL(preset)}
          </button>
        ))}
        <button
          onClick={() => setCustomMode(true)}
          className={`px-3 py-1.5 text-sm border transition-colors ${
            customMode
              ? "border-[#f0ede8] bg-[#1a1a1a] text-[#f0ede8]"
              : "border-[#2a2a2a] bg-[#141414] text-[#6b6b6b] hover:border-[#3d3d3d]"
          }`}
        >
          Custom
        </button>
      </div>

      {customMode && (
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={3650}
            value={value}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 px-3 py-1.5 text-sm bg-[#141414] border border-[#2a2a2a] text-[#f0ede8] focus:outline-none focus:border-[#3d3d3d]"
          />
          <span className="text-sm text-[#6b6b6b]">days</span>
        </div>
      )}

      <p className="font-mono text-[11px] text-[#3d3d3d]">
        Self-destructs on{" "}
        <span className="text-[#6b6b6b]">{formatExpiryDate(value)}</span>
      </p>
    </div>
  )
}
