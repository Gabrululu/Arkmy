"use client"

import { useEffect, useState } from "react"

const STEPS = [
  {
    step: "STEP 01",
    title: "Every message is an on-chain entity.",
    body: "Your conversation is stored as Arkiv entities signed by your wallet. No server ever touches plaintext.",
  },
  {
    step: "STEP 02",
    title: "Insights are pinned to your memory.",
    body: "When the agent identifies a key finding, it creates an insight entity — queryable across all future sessions.",
  },
  {
    step: "STEP 03",
    title: "Access expires automatically.",
    body: "TTL is set at creation. When it expires, the entity is gone. No manual deletion required. Math, not trust.",
  },
]

const INTERVAL_MS = 3500

export function HowItWorksSteps() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % STEPS.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      {STEPS.map(({ step, title, body }, i) => {
        const isActive = i === active
        return (
          <button
            key={step}
            onClick={() => setActive(i)}
            className={`w-full text-left border-l-2 pl-5 py-6 transition-all duration-500 cursor-pointer ${
              isActive ? "border-[#e8442a]" : "border-[#2a2a2a] hover:border-[#3d3d3d]"
            }`}
          >
            <span
              className="font-mono text-xs tracking-widest uppercase transition-colors duration-500"
              style={{ color: isActive ? "#e8442a" : "#3d3d3d" }}
            >
              {step}
            </span>
            <h3
              className="text-xl font-bold mt-2 mb-2 leading-snug transition-colors duration-500"
              style={{ color: isActive ? "#f0ede8" : "#3d3d3d" }}
            >
              {title}
            </h3>
            <p
              className="text-sm leading-relaxed transition-all duration-500 overflow-hidden"
              style={{
                color: "#6b6b6b",
                maxHeight: isActive ? "8rem" : "0",
                opacity: isActive ? 1 : 0,
              }}
            >
              {body}
            </p>

            {/* Progress bar while active */}
            {isActive && (
              <div className="mt-4 h-px bg-[#2a2a2a] overflow-hidden">
                <div
                  className="h-full bg-[#e8442a] origin-left"
                  style={{
                    animation: `step-progress ${INTERVAL_MS}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </button>
        )
      })}

      <style>{`
        @keyframes step-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}
