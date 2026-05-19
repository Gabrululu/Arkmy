"use client"

import type { AgentMode } from "@/lib/arkiv/sessions"
import { MODE_CONFIG } from "@/lib/ai/prompts"

const ACCENT = {
  amber:   { border: "border-amber-500",   bg: "bg-amber-500/10",   text: "text-amber-400" },
  emerald: { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  indigo:  { border: "border-indigo-500",  bg: "bg-indigo-500/10",  text: "text-indigo-400" },
}

interface ModeSelectorProps {
  selected: AgentMode | null
  onSelect: (mode: AgentMode) => void
}

export function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(Object.entries(MODE_CONFIG) as [AgentMode, typeof MODE_CONFIG[AgentMode]][]).map(([mode, config]) => {
        const accent = ACCENT[config.accentColor as keyof typeof ACCENT]
        const isSelected = selected === mode
        return (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className={`p-5 border-2 text-left transition-all ${
              isSelected
                ? `${accent.border} ${accent.bg}`
                : "border-[#2a2a2a] bg-[#141414] hover:border-[#3d3d3d]"
            }`}
          >
            <div className="text-3xl mb-3">{config.icon}</div>
            <div className={`text-base font-semibold mb-1 ${isSelected ? accent.text : "text-[#f0ede8]"}`}>
              {config.name}
            </div>
            <div className="text-sm text-[#6b6b6b]">{config.description}</div>
            <div className="mt-3 font-mono text-[11px] text-[#3d3d3d]">
              Default TTL: {config.defaultTtlDays < 30 ? `${config.defaultTtlDays}d` : `${Math.round(config.defaultTtlDays / 30)}mo`}
            </div>
          </button>
        )
      })}
    </div>
  )
}
