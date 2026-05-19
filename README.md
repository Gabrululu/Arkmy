# Arkmy

> **Your sovereign agent. Your memory. Your TTL.**

A confidential AI agent platform where all conversation history, insights, and access permissions live on [Arkiv](https://docs.arkiv.network) as on-chain entities owned by the user's wallet. No external database. No centralized memory. Everything self-destructs on your schedule.

Built for the **[Arkiv × ETHNS Builder Challenge](https://github.com/Arkiv-Network/arkiv-ethns-builder-challenge)** — AI + Privacy hybrid theme.

---

## What is Arkmy?

Arkmy gives you three specialized AI agents, each backed by a different privacy posture:

| Agent | Specialty | Default TTL | Accent |
|-------|-----------|-------------|--------|
| **Arkmy Lex** | Legal contracts, regulatory risk, clause analysis | 365 days | Amber |
| **Arkmy Bio** | Medical triage, lab results, health pattern analysis | 7 days | Emerald |
| **Arkmy Doc** | Academic research, paper synthesis, citations | 90 days | Indigo |

Every conversation lives exclusively on Arkiv as on-chain entities tied to your Ethereum wallet. When the TTL expires, the data is gone — no action required. You also control who else can read your sessions via time-scoped delegate access.

---

## How It Works

### The Arkiv data model

Arkmy writes four entity types to the [Arkiv Braga testnet](https://explorer.braga.hoodi.arkiv.network):

```
agent_session    — the conversation container (mode, title, TTL)
agent_message    — each user/assistant turn, immutable on-chain
agent_insight    — key findings auto-extracted from responses, lives 2× TTL
agent_delegate   — time-scoped read access granted to another wallet
```

Every entity is stamped with a unique `PROJECT_ATTRIBUTE` (`arkmy-confidential-agents-4z8w`) so queries never collide with other projects sharing the same public chain.

### Ownership model

- **`$owner`** = your wallet. Only you can update or extend your sessions and insights.
- **`$creator`** = set at write time, immutable — provides tamper-proof attribution.
- **Delegates** are separate entities with their own TTL. Access expires automatically; no manual revocation needed.

### Memory-aware AI

Before every response, Arkmy queries all your pinned insights for the active mode and injects them into the system prompt. Your agent remembers conclusions across sessions — without any server-side database.

### Auto-insight extraction

When the agent identifies something worth remembering it tags it inline:

```
[INSIGHT:risk] This clause waives all liability in jurisdictions outside the EU. [/INSIGHT]
```

After streaming completes, the app parses these tags, saves each one as an `agent_insight` entity on Arkiv (with 2× session TTL), and strips the markup from the displayed message.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), TypeScript |
| Data layer | `@arkiv-network/sdk` 0.6.8 — Braga testnet |
| AI | Anthropic SDK (`claude-sonnet-4-20250514`), streaming SSE |
| Wallet | wagmi v3 + viem, MetaMask / injected |
| Styling | Tailwind CSS v4 |
| File parsing | `pdf-parse` v2 (PDF), `mammoth` (DOCX), up to 80,000 chars |
| File upload | `react-dropzone` |

---

## Project Structure

```
arkmy/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── icon.tsx                          # Favicon (generated)
│   ├── dashboard/page.tsx                # Wallet-gated session list
│   ├── session/
│   │   ├── new/page.tsx                  # Create session (mode + TTL)
│   │   └── [sessionId]/
│   │       ├── page.tsx                  # Chat interface
│   │       └── insights/page.tsx         # Pinned insights for session
│   └── api/
│       ├── chat/route.ts                 # POST: streaming AI response (SSE)
│       └── extract/route.ts             # POST: extract text from PDF/DOCX/TXT
├── lib/
│   ├── arkiv/
│   │   ├── client.ts                     # publicClient + createSigningClient (Braga)
│   │   ├── sessions.ts                   # CRUD for agent_session entities
│   │   ├── messages.ts                   # CRUD + batchSaveAssistantTurn (mutateEntities)
│   │   ├── insights.ts                   # CRUD + fetchInsightsByCategory (or/and queries)
│   │   └── delegates.ts                  # CRUD for agent_delegate entities
│   ├── ai/
│   │   ├── prompts.ts                    # System prompts + MODE_CONFIG + insight parsing
│   │   └── memory.ts                     # Load pinned insights → inject into system prompt
│   └── wagmi/
│       └── config.ts                     # wagmi config for Braga chain
└── components/
    ├── Providers.tsx                      # WagmiProvider + QueryClientProvider
    ├── WalletConnect.tsx                  # Mounted pattern — no hydration issues
    ├── ChatInterface.tsx                  # Streaming chat + Arkiv write on each turn
    ├── MessageBubble.tsx                  # Individual message with attachment badge
    ├── FileUpload.tsx                     # Drag-and-drop PDF/DOCX/TXT
    ├── InsightCard.tsx                    # Pinned insight with category color
    ├── SessionCard.tsx                    # Session list item with mode badge + TTL
    ├── ModeSelector.tsx                   # Lex / Bio / Doc picker
    ├── TTLPicker.tsx                      # Mode-specific TTL presets + custom
    └── DelegateManager.tsx               # Grant wallet read access (time-scoped)
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- MetaMask (or any injected wallet)
- An [Anthropic API key](https://console.anthropic.com/)
- GLM tokens from the [Braga faucet](https://braga.hoodi.arkiv.network/faucet/) to sign Arkiv writes

### 1. Clone and install

```bash
git clone <repo-url>
cd arkmy
pnpm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your key:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

The Braga RPC endpoint is hardcoded in `lib/arkiv/client.ts` — no extra config needed.

### 3. Get testnet tokens

1. Open MetaMask and add the Braga network manually:
   - **Network name:** Braga Testnet
   - **RPC URL:** `https://braga.hoodi.arkiv.network/rpc`
   - **Chain ID:** `60138453102`
   - **Currency symbol:** GLM
2. Visit the [Braga faucet](https://braga.hoodi.arkiv.network/faucet/) and request GLM to your address.

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using the App

### Create a session

1. Go to **Dashboard** → connect your wallet
2. Click **+ New Session** (or the mode-specific "New" link)
3. Choose a mode: Lex, Bio, or Doc
4. Name the session and configure the TTL
5. Confirm — this writes an `agent_session` entity to Arkiv

### Chat

- Type a message or drop a file (PDF, DOCX, TXT up to 10 MB / 80,000 characters)
- Each user message is saved on-chain as an `agent_message` entity before the AI call
- The assistant response streams back via SSE
- After streaming, the assistant message and all extracted insights are written to Arkiv in a single `mutateEntities` transaction
- Any `[INSIGHT:...]` tags in the response are parsed, saved as `agent_insight` entities, and shown below the chat

### Delegate access

Click **Share** in the session header → enter a wallet address and a TTL (7 / 30 / 90 days). This creates an `agent_delegate` entity. The delegate can read messages but cannot send messages or create insights. Access expires automatically when the entity's TTL runs out.

### View insights

Click **Insights** in the session header to see all pinned findings for that session, fetched directly from Arkiv. Use the category filter chips (risk, clause, deadline, symptom…) to narrow results — each selection issues a compound `or()`/`and()` query to Arkiv.

---

## Arkiv Entity Schemas

### `agent_session`

```ts
payload:    { title: string, mode: "lex"|"bio"|"doc", createdAt: string }
attributes: [
  { key: "project",  value: "arkmy-confidential-agents-4z8w" },
  { key: "type",     value: "agent_session" },
  { key: "owner",    value: "0x..." },
  { key: "mode",     value: "lex"|"bio"|"doc" },
  { key: "status",   value: "active"|"archived" },
  { key: "ttlDays",  value: "<number>" },
]
expiresIn: ExpirationTime.fromDays(ttlDays)
```

### `agent_message`

```ts
payload:    { role: "user"|"assistant", content: string, hasAttachment: boolean, fileName?: string }
attributes: [
  { key: "project",       value: "arkmy-confidential-agents-4z8w" },
  { key: "type",          value: "agent_message" },
  { key: "sessionId",     value: "<session entityKey>" },
  { key: "owner",         value: "0x..." },
  { key: "messageIndex",  value: <number> },   // numeric — supports asc/desc ordering
  { key: "role",          value: "user"|"assistant" },
]
expiresIn: ExpirationTime.fromDays(ttlDays)
```

### `agent_insight`

```ts
payload:    { summary: string, detail: string, sourceMessageIndex: string }
attributes: [
  { key: "project",    value: "arkmy-confidential-agents-4z8w" },
  { key: "type",       value: "agent_insight" },
  { key: "sessionId",  value: "<session entityKey>" },
  { key: "owner",      value: "0x..." },
  { key: "category",   value: "risk"|"clause"|"deadline"|"symptom"|"pattern"|"finding"|"gap"|... },
  { key: "mode",       value: "lex"|"bio"|"doc" },
  { key: "pinned",     value: "true" },
]
expiresIn: ExpirationTime.fromDays(ttlDays * 2)
```

### `agent_delegate`

```ts
payload:    {}
attributes: [
  { key: "project",     value: "arkmy-confidential-agents-4z8w" },
  { key: "type",        value: "agent_delegate" },
  { key: "sessionId",   value: "<session entityKey>" },
  { key: "owner",       value: "0x..." },
  { key: "delegate",    value: "0x..." },
  { key: "permission",  value: "read" },
]
expiresIn: ExpirationTime.fromDays(7 | 30 | 90)
```

---

## Key Design Decisions

**No external database.** Every read goes through `publicClient.buildQuery()` with `eq()`, `or()`, and `and()` filters on Arkiv. Every write calls `createSigningClient(walletClient).createEntity()` or `mutateEntities()`. There is no Supabase, PostgreSQL, Redis, or localStorage for app state.

**Messages are immutable.** `agent_message` entities are never updated — this matches Arkiv's append-only semantics and produces a tamper-proof conversation log. The `messageIndex` attribute is numeric, so messages are ordered by Arkiv directly via `asc("messageIndex", "number")`.

**Atomic assistant turns.** After each AI response, the assistant message entity and all extracted insight entities are written together in a single `mutateEntities` transaction. The turn is atomic — either everything lands on-chain or nothing does.

**Compound category queries.** The Insights page uses `or([...categories])` wrapped in `and([...baseFilters])` to filter insights by one or more categories in a single Arkiv query, with no client-side post-filtering.

**Differentiated TTLs.** Each entity type has a purpose-appropriate lifespan. Insights live 2× the session TTL so cross-session memory persists after the source session expires.

**Delegate access self-expires.** There is no revoke button. Revocation is implicit — delegate entities have their own TTL and vanish automatically. This eliminates an entire class of access-control bugs.

**Memory injection.** Before every API call, `buildSystemPromptWithMemory()` queries all pinned insights for the active wallet + mode and appends them to the system prompt. The agent has continuity across sessions without any server-side state.

---

## Deployment

The easiest path is [Vercel](https://vercel.com):

```bash
pnpm dlx vercel
```

Set `ANTHROPIC_API_KEY` in your Vercel project settings under **Environment Variables**. The app connects to Arkiv Braga testnet directly from the browser (reads) and from the Next.js API routes (AI calls + memory queries).

---

## Arkiv Network

| | |
|-|-|
| **Testnet** | Braga (replaced Kaolin on May 15, 2026) |
| **Chain ID** | 60138453102 |
| **RPC** | `https://braga.hoodi.arkiv.network/rpc` |
| **Explorer** | [explorer.braga.hoodi.arkiv.network](https://explorer.braga.hoodi.arkiv.network) |
| **Faucet** | [braga.hoodi.arkiv.network/faucet](https://braga.hoodi.arkiv.network/faucet/) |
| **Docs** | [docs.arkiv.network](https://docs.arkiv.network) |

---

## Challenge Context

Submitted to the [Arkiv × ETHNS Builder Challenge](https://github.com/Arkiv-Network/arkiv-ethns-builder-challenge) during Genesis Block Month at Network School.

- **Theme:** AI + Privacy (hybrid)
- **Submission deadline:** May 25, 2026 — 23:59 UTC
- **Submit at:** [forms.arkiv.network/ethns-arkiv-challenge](https://forms.arkiv.network/ethns-arkiv-challenge)

---

## License

MIT
