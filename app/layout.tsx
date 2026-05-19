import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jet",
  display: "swap",
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"),
  title: "Arkmy — Your sovereign agent. Your memory. Your TTL.",
  description:
    "A confidential AI agent platform where all conversation history and insights live on Arkiv as on-chain entities owned by your wallet.",
  openGraph: {
    title: "Arkmy",
    description: "Your sovereign agent. Your memory. Your TTL.",
    images: [{ url: "/icon.svg", width: 512, height: 512, alt: "Arkmy" }],
  },
  twitter: {
    card: "summary",
    title: "Arkmy",
    description: "Your sovereign agent. Your memory. Your TTL.",
    images: ["/icon.svg"],
  },
}

// Inline script text — runs synchronously before any JS bundle loads.
// Suppresses MetaMask "Failed to connect" unhandledRejections that fire when
// the extension's Manifest V3 service worker is sleeping on page load.
const METAMASK_SUPPRESSOR = `(function(){window.addEventListener('unhandledrejection',function(e){var m=(e.reason&&e.reason.message)||'';if(m.indexOf('Failed to connect to MetaMask')!==-1||m.indexOf('MetaMask extension not found')!==-1||m.indexOf('Could not establish connection')!==-1){e.preventDefault();}});})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Must execute before wagmi reconnects on mount */}
        {/* suppressHydrationWarning: Hive Keychain extension injects src= into this tag */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: METAMASK_SUPPRESSOR }} />
      </head>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
