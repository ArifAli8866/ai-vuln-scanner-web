# AI Vuln Scanner — Generative UI

A chat interface that calls a real server-side security tool and renders the
result as actual UI components (a score gauge + findings table), not a JSON
dump. Built with the [Vercel AI SDK](https://ai-sdk.dev) v5 on Next.js.

This is a rebuild of the original `ai-vuln-scanner` (Python/FastAPI + Nmap +
Groq) as a **generative UI** exercise: the assignment requires a typed
server tool, all four tool-part lifecycle states rendered distinctly, at
least one result rendered as a component, a designed error state, and a
confirmation step before the tool runs. The original Python scanner did
Nmap port scans + an LLM chat; this version keeps the HTTP-security-header
audit piece (the part that's safe to run against arbitrary third-party URLs
without `sudo`/raw sockets) and rebuilds the whole interaction model around
it.

## Running it

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open `http://localhost:3000` and try one of the suggested prompts, e.g.
`Scan https://example.com`.

To deploy a preview URL: push this folder to a repo and import it on
[Vercel](https://vercel.com/new), setting `ANTHROPIC_API_KEY` as an
environment variable. No other config is required.

## How the conversation flows

1. User: "Scan https://example.com"
2. Model calls **`requestScanConfirmation`** with `{ url }`. This tool has
   no `execute` function, so the AI SDK pauses the conversation and the
   client renders a confirm/deny card.
3. User clicks **Allow scan** → the client calls `addToolResult(...)` with
   `{ approved: true }` → the SDK automatically resends the conversation.
4. Model calls **`scanHeaders`** with `{ url }`. This tool *does* have an
   `execute` function, so it runs on the server immediately: a real
   `fetch()` against the target, header-by-header evaluation, a computed
   risk score.
5. The client renders the result as a `ScoreCard` (risk gauge) and a
   `FindingsTable` (per-header pass/fail with severity), and the model adds
   a short plain-language summary underneath.

If the user clicks **Deny** instead, the model acknowledges and stops —
`scanHeaders` is never called.

## Tool contract

Both tools are defined in [`lib/tools.ts`](./lib/tools.ts) using `zod`
schemas via the AI SDK's `tool()` helper.

### `requestScanConfirmation`

Human-in-the-loop gate. No `execute` — resolved by the client via
`addToolResult`.

| | |
|---|---|
| **Purpose** | Ask the user for explicit permission before the assistant scans a URL. |
| **Input schema** | `{ url: string }` — the exact target URL, described to the model as "the exact target URL the assistant wants permission to scan". |
| **Output schema** | `{ approved: boolean }` |
| **Who resolves it** | The browser, via `addToolResult({ tool: "requestScanConfirmation", toolCallId, output: { approved } })` after the user clicks Allow/Deny. |

### `scanHeaders`

Server-side tool. Has `execute`, runs immediately when called.

| | |
|---|---|
| **Purpose** | Fetch a target URL and audit its HTTP response for missing/weak security headers, cookie flags, server-header disclosure, and HTTPS enforcement. |
| **Input schema** | `{ url: string }` — fully-qualified http(s) URL; the model is told to add `https://` if the user didn't include a scheme. |
| **Return shape** (`ScanResult`, [`lib/security-check.ts`](./lib/security-check.ts)) | see below |
| **Errors** | Throws `ScanTimeoutError` (8s fetch timeout) or `ScanNetworkError` (DNS/connection failure, invalid URL). The AI SDK converts a thrown error from `execute` into an `output-error` tool part with `errorText` — the client never sees a raw stack trace or crashes. |

```ts
interface ScanResult {
  url: string;              // requested URL (scheme normalized)
  finalUrl: string;         // URL after redirects
  statusCode: number;
  server: string | null;    // Server header, if disclosed
  httpsEnforced: boolean;
  riskScore: number;        // 0–10, weighted average of finding severities
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "Info";
  findings: Array<{
    id: string;
    header: string;                        // e.g. "content-security-policy"
    status: "missing" | "present" | "weak";
    severity: "critical" | "high" | "medium" | "low" | "info";
    detail: string;                        // human-readable explanation
  }>;
  scannedAt: string;        // ISO timestamp
}
```

Checks performed: `Strict-Transport-Security`, `Content-Security-Policy`,
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Server` header disclosure, cookie `Secure`/`HttpOnly`
flags, and HTTPS enforcement — ported directly from the original project's
`scanner.py` header checklist.

## Tool-part lifecycle → UI states

Each tool call streams through up to four states, and each gets a visually
distinct component (see [`components/chat/ToolPart.tsx`](./components/chat/ToolPart.tsx),
the state-machine router):

| State | Question it answers | Component | Visual treatment |
|---|---|---|---|
| `input-streaming` | What is it doing? | `InputStreamingCard` | Shimmering skeleton bar, partial URL typing in, muted/uncommitted styling |
| `input-available` | With what input, and is it running? | `RunningCard` (scan) / `ConfirmCard` (confirmation) | Scan: solid card with spinner + committed URL. Confirmation: amber "permission needed" card with Allow/Deny buttons |
| `output-available` | What came back? | `ScoreCard` + `FindingsTable` (scan) / `ConfirmResolvedCard` (confirmation) | Scan: circular risk gauge + colored severity table, no raw JSON. Confirmation: compact green/muted resolved line |
| `output-error` | What went wrong? | `ErrorCard` | Red left-accent card, human-readable message, **Retry scan** button that resubmits the same URL |

The error state was designed first (see `ErrorCard.tsx`) rather than bolted
on: it doesn't assume success, and the retry action is a real affordance,
not a dead end.

## Project structure

```
app/
  api/chat/route.ts     — streamText + tool wiring, system prompt
  page.tsx              — chat UI, useChat + addToolResult
  layout.tsx, globals.css
lib/
  tools.ts              — Zod schemas, tool() definitions, execute fn
  security-check.ts     — real fetch()-based header audit + risk scoring
  types.ts              — AppUIMessage type derived from the tool defs
components/chat/
  ToolPart.tsx           — state-machine router (the four states)
  InputStreamingCard.tsx
  RunningCard.tsx
  ConfirmCard.tsx
  ConfirmResolvedCard.tsx
  ScoreCard.tsx
  FindingsTable.tsx
  ErrorCard.tsx
  severity.ts            — shared severity → color/label mapping
```

## Notes / limitations

- Only the HTTP-header audit was carried over from the original scanner.
  Nmap port scanning needs raw sockets / `sudo` and isn't something a
  server-side tool should run against arbitrary user-supplied targets in a
  hosted app, so it was intentionally left out of this rebuild.
- `scanHeaders` only ever contacts the URL the *user* approved via the
  confirmation tool — the model cannot skip the confirmation step because
  the system prompt requires it and the UI only offers `Allow`/`Deny`
  actions for it.
- Fetch timeout is 8s; slow or non-responsive targets surface as a
  `ScanTimeoutError` → `output-error` state.
