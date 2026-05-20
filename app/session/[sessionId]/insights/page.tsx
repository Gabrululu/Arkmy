"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { Hex } from "@arkiv-network/sdk"
import type { SessionPayload } from "@/lib/arkiv/sessions"
import type { InsightPayload, InsightCategory } from "@/lib/arkiv/insights"
import { fetchSessionByKey } from "@/lib/arkiv/sessions"
import { fetchSessionInsights, fetchInsightsByCategory } from "@/lib/arkiv/insights"
import { InsightCard } from "@/components/InsightCard"
import { WalletConnect } from "@/components/WalletConnect"

type InsightItem = { category: string; summary: string; key: string }

const CATEGORY_GROUPS: Record<string, InsightCategory[]> = {
  Legal:   ["risk", "clause", "deadline"],
  Medical: ["symptom", "pattern", "alert"],
  Research:["finding", "methodology", "gap"],
  Other:   ["reminder"],
}

export default function InsightsPage() {
  const params = useParams()
  const sessionId = params.sessionId as Hex

  const [sessionData, setSessionData] = useState<SessionPayload | null>(null)
  const [allInsights, setAllInsights] = useState<InsightItem[]>([])
  const [filtered, setFiltered] = useState<InsightItem[]>([])
  const [activeCategories, setActiveCategories] = useState<InsightCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    async function load() {
      setLoading(true)
      try {
        const [session, insightResult] = await Promise.all([
          fetchSessionByKey(sessionId),
          fetchSessionInsights(sessionId),
        ])
        setSessionData(session.toJson() as SessionPayload)
        const parsed = parseInsights(insightResult)
        setAllInsights(parsed)
        setFiltered(parsed)
      } catch (err: any) {
        setError(err?.message ?? "Failed to load insights")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  function parseInsights(result: Awaited<ReturnType<typeof fetchSessionInsights>>): InsightItem[] {
    return result.entities
      .map((e) => {
        try {
          const payload = e.toJson() as InsightPayload
          const category = e.attributes?.find((a) => a.key === "category")?.value as string ?? "unknown"
          return { category, summary: payload.summary, key: e.key }
        } catch {
          return null
        }
      })
      .filter(Boolean) as InsightItem[]
  }

  async function toggleCategory(cat: InsightCategory) {
    const next = activeCategories.includes(cat)
      ? activeCategories.filter((c) => c !== cat)
      : [...activeCategories, cat]

    setActiveCategories(next)
    setFiltering(true)
    try {
      if (next.length === 0) {
        setFiltered(allInsights)
      } else {
        const result = await fetchInsightsByCategory(sessionId, next)
        setFiltered(parseInsights(result))
      }
    } catch {
      setFiltered(allInsights.filter((i) => next.includes(i.category as InsightCategory)))
    } finally {
      setFiltering(false)
    }
  }

  const presentCategories = new Set(allInsights.map((i) => i.category))

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <nav className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <Link href={`/session/${sessionId}`} className="text-xs text-[#6b6b6b] hover:text-[#f0ede8]">
            ← Back to chat
          </Link>
          {sessionData && (
            <>
              <span className="text-[#1a1a1a]">|</span>
              <span className="text-sm text-[#6b6b6b]">Insights · {sessionData.title}</span>
            </>
          )}
        </div>
        <WalletConnect />
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#f0ede8]">Pinned Insights</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">
            Key findings auto-extracted and stored on Arkiv.
          </p>
        </div>

        {/* Category filter — only shown when there are insights */}
        {!loading && allInsights.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {Object.entries(CATEGORY_GROUPS).flatMap(([, cats]) =>
              cats
                .filter((c) => presentCategories.has(c))
                .map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={`px-2.5 py-1 text-xs border transition-colors capitalize ${
                      activeCategories.includes(c)
                        ? "border-[#e8442a]/60 bg-[#e8442a]/10 text-[#e8442a]"
                        : "border-[#2a2a2a] text-[#6b6b6b] hover:border-[#3d3d3d]"
                    }`}
                  >
                    {c}
                  </button>
                )),
            )}
            {activeCategories.length > 0 && (
              <button
                onClick={() => { setActiveCategories([]); setFiltered(allInsights) }}
                className="px-2.5 py-1 text-xs text-[#3d3d3d] hover:text-[#6b6b6b] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {(loading || filtering) && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#141414] border border-[#1a1a1a] animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-[#e8442a]/5 border border-[#e8442a]/30 text-sm text-[#e8442a]">
            {error}
          </div>
        )}

        {!loading && !filtering && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#6b6b6b] text-sm">
              {activeCategories.length > 0 ? "No insights match the selected filters." : "No insights yet."}
            </p>
            <p className="text-[#3d3d3d] text-xs mt-1">
              {activeCategories.length === 0 && "Insights are auto-pinned when the agent flags important findings."}
            </p>
          </div>
        )}

        {!loading && !filtering && (
          <div className="space-y-3">
            {filtered.map((ins) => (
              <InsightCard key={ins.key} category={ins.category} summary={ins.summary} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
