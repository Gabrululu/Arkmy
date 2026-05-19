import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          border: "1px solid #333",
        }}
      >
        {/* Hexagonal accent ring */}
        <div
          style={{
            position: "absolute",
            width: 20,
            height: 20,
            border: "1.5px solid #f59e0b",
            borderRadius: 4,
            transform: "rotate(45deg)",
            opacity: 0.5,
          }}
        />
        {/* A lettermark */}
        <span
          style={{
            fontFamily: "sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: "#f5f5f5",
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          A
        </span>
      </div>
    ),
    { ...size },
  )
}
