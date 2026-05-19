const CATEGORY_COLORS: Record<string, string> = {
  risk:        "text-[#e8442a] border-[#e8442a]/30 bg-[#e8442a]/5",
  alert:       "text-orange-400 border-orange-500/30 bg-orange-500/5",
  clause:      "text-amber-400 border-amber-500/30 bg-amber-500/5",
  deadline:    "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
  symptom:     "text-pink-400 border-pink-500/30 bg-pink-500/5",
  pattern:     "text-[#3d9e4a] border-[#3d9e4a]/30 bg-[#3d9e4a]/5",
  finding:     "text-indigo-400 border-indigo-500/30 bg-indigo-500/5",
  methodology: "text-blue-400 border-blue-500/30 bg-blue-500/5",
  gap:         "text-purple-400 border-purple-500/30 bg-purple-500/5",
  reminder:    "text-[#6b6b6b] border-[#2a2a2a] bg-[#141414]",
}

interface InsightCardProps {
  category: string
  summary: string
  compact?: boolean
}

export function InsightCard({ category, summary, compact }: InsightCardProps) {
  const colorClass = CATEGORY_COLORS[category] ?? "text-[#6b6b6b] border-[#2a2a2a] bg-[#141414]"

  if (compact) {
    return (
      <div className={`px-3 py-2 border text-xs ${colorClass}`}>
        <span className="font-mono uppercase tracking-widest opacity-70">{category}</span>
        <p className="mt-0.5 text-[#f0ede8]">{summary}</p>
      </div>
    )
  }

  return (
    <div className={`p-4 border ${colorClass}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest opacity-70 mb-2">{category}</p>
      <p className="text-sm text-[#f0ede8]">{summary}</p>
    </div>
  )
}
