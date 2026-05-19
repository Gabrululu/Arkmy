import NextLink from "next/link"
import type { ComponentProps } from "react"
import { WalletConnect } from "@/components/WalletConnect"
import { MobileNav } from "@/components/MobileNav"
import { FadeUp } from "@/components/FadeUp"
import { HowItWorksSteps } from "@/components/HowItWorksSteps"

// Keychainify (and similar crypto wallet extensions) inject `keychainify-checked`
// onto every <a> after React hydrates, causing hydration mismatch warnings.
// suppressHydrationWarning tells React to ignore attribute differences on these elements.
const SL = (props: ComponentProps<typeof NextLink>) => (
  <NextLink suppressHydrationWarning {...props} />
)
const SA = (props: ComponentProps<"a">) => (
  <a suppressHydrationWarning {...props} />
)

/* ─── Data ──────────────────────────────────────────────────────── */

const PROBLEM_CARDS = [
  {
    num: "001",
    label: "Data extraction",
    title: "They train on your conversations.",
    body: "Every message. Every document. Every insight. It flows through infrastructure you don't control.",
  },
  {
    num: "002",
    label: "No expiry",
    title: "Your data lives forever. Theirs.",
    body: "Close your account — your data doesn't go with you. Terms change. Policies evolve. Your history stays.",
  },
  {
    num: "003",
    label: "Identity lock-in",
    title: "They own your agent's memory.",
    body: "Switch providers, lose everything. Your context, your insights, your history — gone.",
  },
  {
    num: "004",
    label: "Zero proof",
    title: "You can't verify what they know.",
    body: "No audit trail. No cryptographic proof. Trust us, they say. You have no choice but to comply.",
  },
]

const MODES = [
  {
    icon: "⚖",
    tag: "LEX",
    name: "Legal analysis agent.",
    desc: "Contracts, regulations, risk assessment. Your case files expire on your terms.",
    ttlLabel: "DEFAULT TTL: 365 DAYS",
    accent: "#f59e0b",
    ttlBg: "rgba(245,158,11,0.08)",
    ttlBorder: "rgba(245,158,11,0.2)",
    href: "/session/new?mode=lex",
    linkText: "Lex",
  },
  {
    icon: "⚕",
    tag: "BIO",
    name: "Health & medical agent.",
    desc: "Symptoms, lab reports, health patterns. Maximum confidentiality, minimum retention.",
    ttlLabel: "DEFAULT TTL: 7 DAYS",
    accent: "#10b981",
    ttlBg: "rgba(16,185,129,0.08)",
    ttlBorder: "rgba(16,185,129,0.2)",
    href: "/session/new?mode=bio",
    linkText: "Bio",
  },
  {
    icon: "◈",
    tag: "DOC",
    name: "Research & document agent.",
    desc: "Academic papers, analysis, synthesis. Expires with your project.",
    ttlLabel: "DEFAULT TTL: 90 DAYS",
    accent: "#6366f1",
    ttlBg: "rgba(99,102,241,0.08)",
    ttlBorder: "rgba(99,102,241,0.2)",
    href: "/session/new?mode=doc",
    linkText: "Doc",
  },
]


const ENTITY_ROWS: Array<{ label: string; value: string; green?: boolean }> = [
  { label: "type",         value: "agent_message" },
  { label: "owner",        value: "0x1a2b...f3e4" },
  { label: "sessionId",    value: "ek_0x8f3a..." },
  { label: "messageIndex", value: "003" },
  { label: "blockNumber",  value: "21,847,293" },
  { label: "expiresIn",    value: "7 days ✓", green: true },
]

const FOOTER_LINKS = [
  { label: "Dashboard",       href: "/dashboard" },
  { label: "How it works",    href: "#how-it-works" },
  { label: "GitHub ↗",        href: "https://github.com/Arkiv-Network/arkiv-ethns-builder-challenge" },
  { label: "Arkiv Network ↗", href: "https://docs.arkiv.network" },
  { label: "Explorer ↗",      href: "https://explorer.braga.hoodi.arkiv.network" },
]

const TICKER_ITEMS = [
  "YOUR KEYS, YOUR MEMORY",
  "ON-CHAIN HISTORY",
  "TTL-CONTROLLED EXPIRY",
  "NO CENTRALIZED STORAGE",
  "WALLET-OWNED SESSIONS",
  "CROSS-SESSION MEMORY",
  "CONFIDENTIAL BY DESIGN",
]

/* ─── Page ──────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f0ede8] flex flex-col">

      {/* ── Sticky nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/92 border-b border-[#1a1a1a] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">

          <div className="flex items-center gap-8">
            <span className="font-mono font-bold tracking-[0.2em] text-[13px] text-[#f0ede8] uppercase">
              arkmy
            </span>
            <nav className="hidden md:flex items-center gap-6">
              <SA href="#how-it-works" className="mono-label hover:text-[#f0ede8] transition-colors">
                How it works
              </SA>
              <SA href="#agents" className="mono-label hover:text-[#f0ede8] transition-colors">
                Agents
              </SA>
              <SL href="/dashboard" className="mono-label hover:text-[#f0ede8] transition-colors">
                Dashboard →
              </SL>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <WalletConnect />
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── §1 HERO ────────────────────────────────────────────── */}
        <section className="py-24 md:py-36 px-5 md:px-8 text-center">
          <div className="max-w-5xl mx-auto">

            <div className="flex justify-center mb-10">
              <span className="badge badge-green">✓ Powered by Arkiv — on-chain memory</span>
            </div>

            <h1
              className="font-bold leading-[0.92] tracking-tight mb-8"
              style={{ fontSize: "clamp(2.75rem, 8vw, 5.5rem)" }}
            >
              <span className="block">Your sovereign agent.</span>
              <span className="block">Your memory.</span>
              <span className="block text-[#e8442a]">Your TTL.</span>
            </h1>

            <p className="text-base md:text-lg text-[#6b6b6b] max-w-lg mx-auto mb-10 leading-relaxed">
              An AI agent platform where conversation history, insights, and access
              permissions live on Arkiv — owned by your wallet, not our servers.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <SL href="/dashboard" className="btn-primary">Open Dashboard →</SL>
              <SA href="#how-it-works" className="btn-secondary">How it works</SA>
            </div>
          </div>
        </section>

        {/* ── Marquee ticker ─────────────────────────────────────── */}
        <div className="bg-[#e8442a] overflow-hidden py-3 select-none" aria-hidden="true">
          <div className="marquee-track">
            {/* Two identical copies — animation slides by exactly -50% for seamless loop */}
            {([0, 1] as const).map((i) => (
              <span key={i} className="marquee-copy">
                {TICKER_ITEMS.map((item) => (
                  <span key={item} className="inline-flex items-center">
                    <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#0f0f0f] uppercase px-6">
                      {item}
                    </span>
                    <span className="text-[#0f0f0f]/35 text-xs">•</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── §2 THE PROBLEM ─────────────────────────────────────── */}
        <section className="py-24 md:py-32 px-5 md:px-8">
          <div className="max-w-6xl mx-auto">

            <FadeUp className="mb-12">
              <span className="badge badge-red inline-flex mb-5">× The problem</span>
              <h2
                className="font-bold leading-[1.05] tracking-tight max-w-3xl"
                style={{ fontSize: "clamp(2rem, 6vw, 3.75rem)" }}
              >
                You don&apos;t own your AI memory. And it never forgets you.
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a1a1a]">
              {PROBLEM_CARDS.map(({ num, label, title, body }, i) => (
                <FadeUp key={num} delay={i * 80} className="h-full">
                  <div className="bg-[#0f0f0f] p-6 md:p-8 h-full hover:bg-[#141414] transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <span className="badge badge-red">{label}</span>
                      <span className="font-mono text-sm text-[#2a2a2a]">{num}</span>
                    </div>
                    <h3 className="text-[#f0ede8] text-xl font-bold mb-3 leading-snug">{title}</h3>
                    <p className="text-[#6b6b6b] text-sm leading-relaxed">{body}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── §3 INTRODUCING ARKMY ───────────────────────────────── */}
        <section className="py-24 md:py-32 px-5 md:px-8 border-t-2 border-[#e8442a]">
          <div className="max-w-6xl mx-auto">

            <FadeUp className="text-center mb-16">
              <span className="badge badge-green inline-flex mb-5">✓ Introducing Arkmy</span>
              <h2
                className="font-bold leading-[1.05] tracking-tight mb-4"
                style={{ fontSize: "clamp(2rem, 6vw, 3.75rem)" }}
              >
                Everything sovereign.<br />Own your AI.
              </h2>
              <p className="text-[#6b6b6b] text-base max-w-xl mx-auto">
                A confidential agent platform where your wallet is your identity, your memory
                lives on Arkiv, and your data expires when you say so.
              </p>
            </FadeUp>

            {/* Architecture diagram */}
            <FadeUp>
              <div className="max-w-2xl mx-auto border border-[#2a2a2a] bg-[#141414] font-mono text-xs overflow-hidden">

                <div className="border-b border-[#2a2a2a] px-5 py-3 text-[#3d3d3d] tracking-widest uppercase text-[10px]">
                  YOUR WALLET — ARKMY DATA FLOW
                </div>

                <div className="p-6 space-y-4">
                  {/* Top flow: message → agent → response */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="border border-[#3d3d3d] px-3 py-2 text-[#f0ede8]">YOUR MESSAGE</div>
                    <span className="text-[#e8442a]">——→</span>
                    <div className="border border-[#e8442a]/30 px-3 py-2 text-[#f0ede8] bg-[#e8442a]/5">
                      ARKMY AGENT
                    </div>
                    <span className="text-[#e8442a]">——→</span>
                    <div className="border border-[#3d3d3d] px-3 py-2 text-[#f0ede8]">RESPONSE</div>
                  </div>

                  {/* Down arrows */}
                  <div className="text-[#3d3d3d] pl-[6.5rem] flex gap-[6.5rem]">
                    <span>↓</span><span>↓</span>
                  </div>

                  {/* Entity row */}
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <div className="border border-[#2a2a2a] px-3 py-2 text-[#f0ede8]">ARKIV ENTITY</div>
                      <div className="text-[#3d3d3d] text-[10px] px-1 mt-1">agent_message</div>
                      <div className="text-[#3d9e4a] text-[10px] px-1">TTL: 7 days ✓</div>
                    </div>
                    <div>
                      <div className="border border-[#2a2a2a] px-3 py-2 text-[#f0ede8]">ARKIV INSIGHT</div>
                      <div className="text-[#3d3d3d] text-[10px] px-1 mt-1">agent_insight</div>
                      <div className="text-[#3d9e4a] text-[10px] px-1">TTL: 90 days ✓</div>
                    </div>
                  </div>
                </div>

                {/* Crossed-out features */}
                <div className="border-t border-[#2a2a2a] px-6 py-4 flex flex-wrap gap-5">
                  <span className="text-[#e8442a] line-through">× CLOUD SERVERS</span>
                  <span className="text-[#e8442a] line-through">× TELEMETRY</span>
                  <span className="text-[#e8442a] line-through">× TRAINING PIPELINE</span>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── §4 THREE MODES ─────────────────────────────────────── */}
        <section id="agents" className="py-24 md:py-32 px-5 md:px-8 border-t border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">

            <FadeUp className="mb-12">
              <span className="badge inline-flex mb-5">⚙ Three modes</span>
              <h2
                className="font-bold leading-tight tracking-tight"
                style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}
              >
                One platform. Three confidential agents.
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1a]">
              {MODES.map(({ icon, tag, name, desc, ttlLabel, accent, ttlBg, ttlBorder, href, linkText }, i) => (
                <FadeUp key={tag} delay={i * 100} className="h-full">
                  <div
                    className="bg-[#0f0f0f] p-6 md:p-8 flex flex-col h-full hover:bg-[#141414] transition-colors"
                    style={{ borderTop: `2px solid ${accent}` }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <span style={{ color: accent }}>{icon}</span>
                      <span
                        className="font-mono text-xs font-bold tracking-widest"
                        style={{ color: accent }}
                      >
                        {tag}
                      </span>
                    </div>
                    <h3 className="text-[#f0ede8] text-xl font-bold mb-3 leading-snug">{name}</h3>
                    <p className="text-[#6b6b6b] text-sm leading-relaxed mb-5 flex-1">{desc}</p>

                    <div
                      className="inline-flex items-center font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 mb-5 w-fit"
                      style={{ color: accent, background: ttlBg, border: `1px solid ${ttlBorder}` }}
                    >
                      {ttlLabel}
                    </div>

                    <SL
                      href={href}
                      className="text-sm font-medium transition-opacity hover:opacity-70"
                      style={{ color: accent }}
                    >
                      → Open {linkText} session
                    </SL>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── §5 HOW IT WORKS ────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 md:py-32 px-5 md:px-8 border-t border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">

            <FadeUp className="text-center mb-16">
              <span className="badge inline-flex mb-5">◎ Our approach</span>
              <h2
                className="font-bold leading-tight tracking-tight mb-4"
                style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}
              >
                Memory-first. Proof-native.
              </h2>
              <p className="text-[#6b6b6b] text-base max-w-xl mx-auto">
                Arkmy uses Arkiv as its only data layer. No database. No server.
                Your wallet signs every write.
              </p>
            </FadeUp>

            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">

              {/* Steps — auto-cycling, also clickable */}
              <HowItWorksSteps />

              {/* Live entity panel */}
              <FadeUp>
                <div className="border border-[#2a2a2a] bg-[#141414] font-mono text-xs overflow-hidden">
                  <div className="border-b border-[#2a2a2a] px-4 py-3 text-[#3d3d3d] tracking-widest uppercase text-[10px]">
                    ARKIV ENTITY WRITE
                  </div>
                  <div className="p-5 space-y-2.5">
                    {ENTITY_ROWS.map(({ label, value, green }) => (
                      <div key={label} className="grid grid-cols-[7rem_1fr] gap-3">
                        <span className="text-[#3d3d3d]">{label}</span>
                        <span style={{ color: green ? "#3d9e4a" : "#f0ede8" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#2a2a2a] px-5 py-3 flex items-center">
                    <span className="text-[#3d3d3d] tracking-widest uppercase text-[10px]">status</span>
                    <span className="ml-auto text-[#3d9e4a] font-bold text-[10px] tracking-widest">
                      CONFIRMED ●
                    </span>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── §6 PRIVACY COMPARISON ──────────────────────────────── */}
        <section className="py-24 md:py-32 px-5 md:px-8 border-t border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-start">

            {/* Comparison table */}
            <FadeUp>
              <div className="font-mono text-xs border border-[#2a2a2a] overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-[#2a2a2a]">

                  {/* Traditional column */}
                  <div className="p-5 bg-[#141414]">
                    <div className="text-[#e8442a] tracking-widest uppercase mb-4 text-[10px]">
                      TRADITIONAL AI
                    </div>
                    {[
                      { text: "Your message →",   dim: false },
                      { text: "  Cloud API →",     dim: true  },
                      { text: "  Training data",   dim: true  },
                      { text: "× No expiry",        bad: true  },
                      { text: "× No audit trail",   bad: true  },
                      { text: "× Platform-owned",   bad: true  },
                    ].map(({ text, dim, bad }, i) => (
                      <div
                        key={i}
                        className="py-1"
                        style={{ color: bad ? "rgba(232,68,42,0.7)" : dim ? "#3d3d3d" : "#6b6b6b" }}
                      >
                        {text}
                      </div>
                    ))}
                  </div>

                  {/* Arkmy column */}
                  <div className="p-5 bg-[#141414]">
                    <div className="text-[#3d9e4a] tracking-widest uppercase mb-4 text-[10px]">
                      ARKMY
                    </div>
                    {[
                      { text: "Your message →",   dim: false },
                      { text: "  Arkiv entity",    dim: true  },
                      { text: "  (your wallet)",   dim: true  },
                      { text: "✓ TTL-controlled",  good: true },
                      { text: "✓ Block-verified",  good: true },
                      { text: "✓ Wallet-owned",    good: true },
                    ].map(({ text, dim, good }, i) => (
                      <div
                        key={i}
                        className="py-1"
                        style={{ color: good ? "#3d9e4a" : dim ? "#3d3d3d" : "#6b6b6b" }}
                      >
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Statement + stats */}
            <FadeUp delay={150}>
              <span className="badge inline-flex mb-6">🔒 Privacy</span>
              <h2
                className="font-bold leading-tight tracking-tight mb-5"
                style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}
              >
                Sever the connection.
              </h2>
              <p className="text-[#6b6b6b] text-base leading-relaxed mb-10">
                Your conversations never leave the on-chain layer. No round-trip to a data
                center. No training pipeline. No terms of service that can change overnight.
              </p>

              <div>
                {[
                  { label: "TTL",     value: "User-defined", sub: "From 24h to 365 days" },
                  { label: "Storage", value: "On-chain only", sub: "Arkiv Braga testnet" },
                  { label: "Access",  value: "Wallet-gated", sub: "Cryptographic proof" },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="border-t border-[#1a1a1a] py-4">
                    <div className="mono-label mb-1" style={{ color: "#e8442a" }}>{label}</div>
                    <div className="text-[#f0ede8] text-2xl font-bold leading-tight">{value}</div>
                    <div className="text-[#6b6b6b] text-xs mt-1">{sub}</div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── §7 TERMINAL MOCKUP ─────────────────────────────────── */}
        <section className="py-24 md:py-32 px-5 md:px-8 border-t border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">

            <FadeUp className="text-center mb-14">
              <span className="badge inline-flex mb-5">⚡ Engineered intelligence</span>
              <h2
                className="font-bold leading-tight tracking-tight"
                style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}
              >
                Built for serious confidentiality.
              </h2>
            </FadeUp>

            <FadeUp>
              <div className="max-w-2xl mx-auto">
                {/* Terminal window */}
                <div className="border border-[#2a2a2a] bg-[#0a0a0a] font-mono text-sm overflow-x-auto">

                  {/* Title bar */}
                  <div className="border-b border-[#2a2a2a] bg-[#141414] px-4 py-2.5 flex items-center gap-2.5 sticky left-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e8442a]/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3d9e4a]/70" />
                    <span className="ml-2 text-[#3d3d3d] text-[10px] tracking-widest uppercase">
                      ARKMY://SESSION · SECURE
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 min-w-[420px] space-y-1.5">
                    <div>
                      <span className="text-[#e8442a]">λ</span>
                      <span className="text-[#f0ede8] ml-2">new session --mode=lex --ttl=365d</span>
                    </div>
                    <div>&nbsp;</div>
                    <div className="text-[#6b6b6b]">&gt; Connecting to Arkiv Braga...</div>
                    <div className="text-[#6b6b6b]">&gt; Wallet: 0x1a2b...f3e4</div>
                    <div className="text-[#6b6b6b]">&gt; Creating session entity...</div>
                    <div className="text-[#3d9e4a]">✓ Session created at block #21,847,293</div>
                    <div className="text-[#3d9e4a]">✓ TTL: expires Jan 15, 2027</div>
                    <div className="text-[#3d9e4a]">✓ Memory: loaded 3 prior insights</div>
                    <div>&nbsp;</div>
                    <div className="flex flex-wrap gap-x-2 text-[10px] tracking-widest">
                      <span className="text-[#3d9e4a]">Network: ARKIV</span>
                      <span className="text-[#2a2a2a]">·</span>
                      <span className="text-[#e8442a]">Cloud: OFF</span>
                      <span className="text-[#2a2a2a]">·</span>
                      <span className="text-[#e8442a]">Telemetry: OFF</span>
                    </div>
                    <div>&nbsp;</div>
                    <div>
                      <span className="text-[#e8442a]">λ</span>
                      <span className="text-[#f0ede8] ml-2 animate-pulse">_</span>
                    </div>
                  </div>
                </div>

                {/* Bottom annotations */}
                <div className="hidden md:grid grid-cols-3 mt-5 text-center">
                  {["ON-CHAIN MEMORY", "TTL CONTROL", "ZERO BACKEND"].map((label) => (
                    <div key={label} className="px-2">
                      <div className="border-t border-[#2a2a2a] mb-2" />
                      <span className="font-mono text-[10px] tracking-widest text-[#3d3d3d] uppercase">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── §8 CTA — full red ──────────────────────────────────── */}
        <section className="bg-[#e8442a] py-24 md:py-32 px-5 md:px-8 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="font-mono font-bold text-2xl text-[#0f0f0f] mb-6 tracking-[0.2em] uppercase">
              arkmy
            </div>
            <h2
              className="font-black leading-[0.92] tracking-tight text-[#0f0f0f] mb-5"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
            >
              Break free from platform AI.
            </h2>
            <p className="text-[#0f0f0f]/70 text-base md:text-lg mb-10">
              Your wallet. Your memory. Your rules.
            </p>
            <SL
              href="/dashboard"
              className="inline-flex items-center justify-center bg-[#0f0f0f] text-[#f0ede8] font-bold px-8 py-4 text-sm hover:bg-[#1a1a1a] transition-colors"
            >
              Open Dashboard →
            </SL>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] py-10 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div>
              <div className="font-mono font-bold text-sm text-[#f0ede8] tracking-[0.15em] uppercase mb-1">
                arkmy
              </div>
              <div className="text-[#3d3d3d] text-sm">
                Confidential AI on Arkiv. Braga testnet.
              </div>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-3">
              {FOOTER_LINKS.map(({ label, href }) => (
                <SA
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-[#3d3d3d] text-sm hover:text-[#f0ede8] transition-colors"
                >
                  {label}
                </SA>
              ))}
            </nav>
          </div>

          <div className="border-t border-[#1a1a1a] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-[#2a2a2a] uppercase tracking-widest">
              © 2026 Arkmy — Open source — Minted In Peru
            </span>
            <span className="font-mono text-[11px] text-[#2a2a2a] uppercase tracking-widest">
              All sessions on-chain
            </span>
          </div>
        </div>
      </footer>

    </div>
  )
}
