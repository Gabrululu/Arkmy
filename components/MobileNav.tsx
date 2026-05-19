"use client"

import { useState } from "react"
import Link from "next/link"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Agents", href: "#agents" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Arkiv Docs ↗", href: "https://docs.arkiv.network" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col gap-[5px] p-1.5 ml-1"
        aria-label="Open menu"
      >
        <span className="block w-5 h-px bg-[#f0ede8]" />
        <span className="block w-5 h-px bg-[#f0ede8]" />
        <span className="block w-3 h-px bg-[#f0ede8]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-[#0f0f0f] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between h-14 px-5 border-b border-[#1a1a1a]">
            <span className="font-mono font-bold tracking-[0.2em] text-sm text-[#f0ede8] uppercase">
              arkmy
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[#6b6b6b] hover:text-[#f0ede8] transition-colors text-2xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col flex-1 px-5 pt-4">
            {NAV_LINKS.map(({ label, href }) => {
              const isExternal = href.startsWith("http")
              const isInternal = href.startsWith("/")
              const className =
                "block font-mono text-xs tracking-widest uppercase text-[#6b6b6b] hover:text-[#f0ede8] py-4 border-b border-[#1a1a1a] transition-colors"

              if (isInternal) {
                return (
                  <Link key={label} href={href} onClick={() => setOpen(false)} className={className}>
                    {label}
                  </Link>
                )
              }
              return (
                <a
                  key={label}
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  {label}
                </a>
              )
            })}
          </nav>

          {/* Bottom CTA */}
          <div className="p-5 border-t border-[#1a1a1a]">
            <Link
              href="/session/new"
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-center"
            >
              Start a session →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
