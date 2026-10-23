# Nexus — MVP PRD

Sources of truth, in priority order: the live landing page (brand, voice, marketing experience), then
`Nexus-Feature-List.md` (functional behaviour, data model, prompts), then this repository (implementation approach).

## 1. Product

**Nexus — Beyond memory.** Users drop what they learn (notes, YouTube videos, articles, posts on X). Nexus
absorbs each fragment, connects it to what they dropped before, and when they hand it a real task, it pulls
the fragments that matter, combines them with general AI knowledge and produces the work: an answer, an email
(opened in Gmail), an outline, action steps or a full prep brief.

**Value:** stop having to remember. Personal knowledge plus general knowledge, surfaced exactly when the task
needs it, with the sources shown.

### Goals
- One integrated product: the existing landing page → Google sign-in → a working dashboard on the same domain.
- The capture → connect → hand off → deliver loop works end to end for real data.
- Every answer shows which of the user's fragments it used; personal and general knowledge stay distinct.

### Non-goals (this sprint)
Voice, WhatsApp, PDF, Instagram transcription, Chrome extension, OCR, multi-step autonomous execution,
reminders, collaboration, a new landing page, a test suite beyond smoke checks.

## 2. User journeys
1. **Sign in.** Visitor on `/` → "Try Nexus free" / "Sign in" → `/auth/sign-in` → Google → `/auth/callback`
   → `/dashboard`. Already signed in → straight to `/dashboard`. Sign out → `/`.
2. **Drop.** Paste a note or link → Reading → Understanding → Connecting → confirmation card (title,
   takeaway, source type, up to three connections) → it appears in the Vault.
3. **Hand off.** Type a task, pick a mode (default Full Prep Brief) → response card with `[#n]` citations,
   a Sources section, Copy, and for Draft Email an Open in Gmail action → saved to Ask history.
4. **Your Vault.** Newest-first list, live keyword search, detail modal with summary, source, keywords,
   entities and connected fragments (navigable), delete with confirmation.
5. **Stats.** Public `/stats` with aggregate counts only.

## 3. Landing page and auth behaviour
- `/` stays the existing page. CTAs point at `/auth/sign-in` (was the `/sign-in` placeholder).
- `/auth/sign-in` (route): signed in → `/dashboard`; Google enabled in Supabase → OAuth (PKCE) redirect;
  Google not enabled → `/sign-in?error=google-not-configured` (honest page, no raw provider error).
- `/auth/callback` exchanges the code, sets the session cookies and redirects to `next` (default `/dashboard`).
- `proxy.ts` refreshes the session on every request; `/dashboard` redirects to `/sign-in` without a user.
- `/auth/sign-out` (POST) clears the session and returns to `/`.
- Footer copy says the page demo saves nothing; the signed-in app saves to the user's private Vault.

## 4. Functional requirements (from the spec)
| ID | Requirement |
|---|---|
| F1.1–1.3 | Google OAuth via Supabase, persistent cookie session, RLS on every table |
| F2.1 | YouTube (watch, youtu.be, shorts, embed, live) transcript; no transcript → paste-your-summary recovery |
| F2.2 | Plain text up to 10,000 characters |
| F2.3 | Article URL → Readability; blocked/paywalled → paste-the-text recovery |
| F2.3b | Posts on X via the public oEmbed endpoint |
| F2.4 | Summarise (8.1) → embed summary → top-5 similar → Claude confirms connections (8.2) → save |
| F2.5 | Confirmation card with title, takeaway, connections (clickable) |
| 10.1 | Same URL twice → "You already saved this on <date>. Save again anyway?"; >15,000 chars truncated for Claude, full text stored |
| F3.1–3.4 | Task input, 5 modes, embed + top-8 (> 0.6) + keyword backup, merge/dedupe, Ask prompt (8.3/8.4), markdown card, Sources, Copy, Open in Gmail |
| 10.2 | Empty/irrelevant Vault → general answer + empty-Vault line; Claude failure → retry once → friendly error + Retry |
| F4.1–4.5 | Vault list newest first, row details, detail modal, delete with confirm, live search |
| F6.x | Mobile layout, loading states, friendly errors, slow-call notice with Cancel |
| F7.1–7.2 | Every capture and ask logged; public `/stats` |

## 5. Routes, screens, components
| Route | Kind | Purpose |
|---|---|---|
| `/` | page (static) | Existing landing page |
| `/sign-in` | page | Explains sign-in state and errors; Continue with Google |
| `/auth/sign-in` | GET route | Starts Google OAuth or redirects |
| `/auth/callback` | GET route | Code exchange |
| `/auth/sign-out` | POST route | Sign out |
| `/dashboard` | page (protected) | App shell with Drop / Hand off / Your Vault |
| `/stats` | page (dynamic) | Aggregate counts |
| `/api/capture` | POST | Ingest |
| `/api/captures` | GET | List (no raw content, no vectors) |
| `/api/captures/[id]` | GET, DELETE | Detail with connections; delete |
| `/api/ask` | GET, POST | Ask history; run an ask |

Components: `components/app/*` — `AppShell`, `DropPanel`, `AskPanel`, `VaultPanel`, `CaptureDetail`,
`Markdown`, `SourceIcon`, `Stages`. Reuses `NexusMark`, `ArrowIcon`, brand tokens in `globals.css`.

## 6. Data model
`captures` (id, user_id, type, source_url, raw_content, title, summary, one_line_takeaway, keywords[],
entities[], embedding vector(1536), summary_source, created_at) — `capture_links` (from → to, reason,
cascade on delete) — `asks` (task, mode, response, used_capture_ids[]). Functions: `match_captures`
(security invoker), `keyword_captures` (security invoker), `nexus_stats` (security definer, counts only).
Migration: `supabase/migrations/20261023160000_nexus_core.sql`.

## 7. AI pipelines
**Providers** (`lib/ai.ts`): Claude via `ANTHROPIC_API_KEY` (Haiku 5.5 for summaries and connections,
Sonnet 5.5 for asks) or via Vercel AI Gateway (`AI_GATEWAY_API_KEY` / the deployment's OIDC token).
Embeddings: OpenAI `text-embedding-3-small` (1536-d) via `OPENAI_API_KEY` or the gateway.

**Ingestion:** detect type → fetch → truncate to 15,000 chars → Claude 8.1 (validated JSON) → embed summary
→ `match_captures(threshold 0.3, 5)` → Claude 8.2 → insert capture + links.
No Claude configured → a plain extract is saved and labelled "Basic summary" (`summary_source = 'basic'`).
No embeddings → no semantic candidates; connections fall back to shared keywords/entities and are labelled.

**Ask:** embed task → `match_captures(0.6, 8)` + entity/keyword terms → `keyword_captures` → merge, dedupe,
cap 8 → prompt 8.3 + 8.4 → Claude (retry once) → log ask → return response + sources.

## 8. API contracts
- `POST /api/capture` `{ input: string, force?: boolean, pasted?: { url, text } }` →
  `200 { capture, connections: [{ id, title, reason }], notices: string[] }` ·
  `409 { code: "duplicate", savedAt }` · `422 { code: "no-transcript" | "blocked" | "empty", message, title? }`
- `GET /api/captures` → `{ captures: CaptureSummary[] }`
- `GET /api/captures/:id` → `{ capture, connections: [{ id, title, reason, direction }] }` · `DELETE` → `204`
- `POST /api/ask` `{ task, mode }` → `{ ask: { id, task, mode, response, sources, generalOnly } }` ·
  `503 { code: "ai-not-configured", sources }` · `502 { code: "ai-failed" }`
- `GET /api/ask` → `{ asks: AskRecord[] }`
Errors are `{ code, message }` with human-readable messages; no stack traces.

## 9. Environment
| Variable | Where | Required for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (all) | everything signed-in |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel (all) | everything signed-in |
| `ANTHROPIC_API_KEY` | Vercel, server only | Claude (or use the gateway) |
| `OPENAI_API_KEY` | Vercel, server only | embeddings (or use the gateway) |
| `AI_GATEWAY_API_KEY` | Vercel, server only | optional single key for both |
| Google OAuth client id/secret | Supabase dashboard | Google sign-in |

## 10. Acceptance criteria
As in `Nexus-Feature-List.md` §12 and the build brief §12; tracked with evidence in `BUILD_STATUS.md`.

## 11. Traceability
| Requirement | Screen/route | Backend / database | Acceptance condition |
|---|---|---|---|
| Google sign-in | `/` CTA → `/auth/sign-in` → `/auth/callback` | Supabase Auth (Google) | Lands on `/dashboard`; refresh keeps session |
| Protected app | `/dashboard`, `proxy.ts` | Supabase session cookies | Signed-out request redirects to `/sign-in` |
| Sign out | App bar menu → `/auth/sign-out` | `auth.signOut` | Returns to `/` |
| Text capture | Drop tab | `POST /api/capture`, `captures` | Card shows title + takeaway; row in Vault |
| YouTube / article / X | Drop tab | fetchers in `lib/ingest/*` | Transcript/article/post text summarised, or recovery offered |
| Summaries | Drop card, Vault detail | Claude 8.1 | Title, 150–200 word summary, takeaway, keywords, entities |
| Connections | Drop card, Vault detail | embeddings, `match_captures`, Claude 8.2, `capture_links` | Only Claude-confirmed links shown, with reasons |
| Duplicate URL | Drop tab | `captures.source_url` | Confirm before saving again |
| Ask + modes | Hand off tab | `POST /api/ask`, Claude 8.3/8.4 | Mode changes format; `[#n]` cites the user's fragments |
| Sources | Response card | `asks.used_capture_ids` | Lists fragments used, links open in a new tab |
| Gmail | Response card (Draft Email) | compose URL | Opens `mail.google.com` with subject + body |
| Empty Vault | Response card | retrieval returns 0 | Empty-Vault line shown with a general answer |
| Vault list/search | Your Vault tab | `GET /api/captures` | Newest first; filters as you type |
| Detail + navigate | Detail modal | `GET /api/captures/:id` | Summary, source, keywords, entities, connected fragments clickable |
| Delete | Detail modal / row menu | `DELETE /api/captures/:id`, cascade | Gone from list and from future asks |
| Stats | `/stats` | `nexus_stats()` | Live aggregate counts, no private data |

## 12. Known limitations (two-hour build)
- Google sign-in needs a Google OAuth client entered in Supabase (manual, cannot be created from the CLI).
- AI needs `ANTHROPIC_API_KEY` + `OPENAI_API_KEY`, or a card on the Vercel team for AI Gateway.
- YouTube transcripts can be refused from datacenter IPs; the paste-a-summary recovery covers it.
- Instagram reels and PDFs are not transcribed (roadmap); a reel URL is treated as a web page.
- No streaming responses; a slow call shows "Still thinking…" with Cancel.
