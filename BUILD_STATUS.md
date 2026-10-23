# Build status — Oct 23, 2026

- [x] **Phase 0** — repo inspected, `PRD.md`; Supabase project `nexus` (`okiivqojobjwrbncozuf`, Mumbai) created;
  schema, RLS and functions migrated (`supabase/migrations/20261023160000_nexus_core.sql`); auth site URL and
  redirect allow-list pushed; public Supabase env vars on Vercel (all environments).
- [x] **Phase 1** — CTAs → `/auth/sign-in` (Google OAuth, PKCE) → `/auth/callback` → `/dashboard`; `proxy.ts`
  session refresh and guard; sign-out (POST) → `/`; app shell with Drop / Hand off / Your Vault, account menu,
  bottom tab bar on phones.
- [x] **Phase 2** — `/api/capture`: text (≤10,000), YouTube (watch, youtu.be, shorts, embed, live; transcript via
  innertube + oEmbed title), articles (Readability), posts on X (oEmbed); 15,000-char cap for Claude with full
  text stored; Claude 8.1 with JSON validation and retry; embeddings; `match_captures`; Claude 8.2; links saved;
  duplicate-URL confirm; no-transcript / blocked recovery with paste; private-address guard.
- [x] **Phase 3** — `/api/ask`: embed → `match_captures` (0.6, top 8, backfill at 0.4 when fewer than 3) +
  keyword/entity backup → merge/dedupe → Claude 8.3/8.4 with retry → citations renumbered so Sources are exactly
  the fragments cited → ask logged. UI: five modes (default Full Prep Brief), Markdown card, citation chips,
  Sources, Copy, Open in Gmail, history, empty-Vault line, Still thinking… + Cancel, Retry.
- [x] **Phase 4** — Vault list newest first, live search, row menu, detail dialog (summary, source, keywords,
  names, connections that navigate), delete with confirmation (links cascade). `/stats` via `nexus_stats()`.
- [x] **Phase 5** — lint, typecheck, build, Playwright (49 passed, 17 skipped by design), API and UI smoke tests, deployed and re-checked in production (below).

## Evidence (local production build, real Supabase, two test users)

| Check | Result |
|---|---|
| Signed-out `GET /api/captures` | 401 |
| Signed-out `/dashboard` | redirects to `/sign-in` |
| Text drop | 200, saved, appears in Vault |
| Second related note | connected to the first ("Shares the keywords: rajesh.") |
| YouTube `youtu.be/ZoqgAy3h4OM` | transcript fetched, saved as `youtube` with the video title |
| Article `paulgraham.com/startupideas.html` | Readability text saved |
| Same article with `?utm_source=x` | 409 duplicate → "Save again anyway?" |
| `http://127.0.0.1…` | 400, refused |
| 10,001 characters | 400, friendly message |
| User B lists / reads / deletes user A's fragment | 0 rows / 404 / 404 (RLS) |
| User B asks about A's data | 0 sources |
| Delete note 2 | 204; detail 404; its link gone; later ask doesn't retrieve it |
| Ask without AI | 503 with a plain message and the fragments it would use |
| Desktop 1440 and phone 390 screens | Drop, Hand off, Vault, dialog, menus checked; no page errors |

## Evidence (production, https://second-brain-six-swart.vercel.app, commit 6c25c17)

| Check | Result |
|---|---|
| `/` | 200, static, CTAs point at `/auth/sign-in` |
| `/auth/sign-in` | 307 → `/sign-in?error=google-not-configured` (honest page) |
| `/dashboard` signed out | 307 → `/sign-in` |
| `/api/captures` signed out | 401 |
| `/stats` | live totals from `nexus_stats()` |
| Signed-in dashboard | renders |
| Text, article (`paulgraham.com/ds.html`), post on X (`x.com/jack/status/20`) | 200, saved |
| YouTube from Vercel | transcript refused → 422 "Paste a summary yourself?" → saved with the pasted summary and the real title |
| Ask without AI | 503 with the fragment it would use |
| User B reads user A's fragment | 404 |
| Delete | 204 for each test fragment |

Found and fixed in production: jsdom 30 could not load on Vercel's Node runtime (ERR_REQUIRE_ESM) and took the
whole capture route down; replaced with linkedom, loaded lazily. Test users and their data were deleted
afterwards, so `/stats` starts at zero. Email sign-up is switched off in Supabase; Google is the only way in.

## Blockers (need the owner)

1. **Google sign-in**: the Google provider is not enabled in Supabase. Needs a Google OAuth client (steps in
   `README.md`). Until then the CTA lands on an honest "Google sign-in isn't switched on yet" page.
2. **AI**: no `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`, and Vercel AI Gateway refuses requests until the team has
   a card on file. Until then drops get a labelled basic summary and Hand off can't write. Claude summaries,
   Claude-confirmed connections, semantic retrieval and the five generated outputs are implemented but unverified
   against a live model.

3. **YouTube transcripts on Vercel**: YouTube refuses caption requests from Vercel's datacenter IPs (they work
   from a home connection). The paste-a-summary recovery covers it; a reliable fix is a transcript API or a
   residential proxy, which needs an account and a key.

## Not built (spec §9 roadmap)
Voice, WhatsApp, PDF, Instagram transcription, Chrome extension, OCR, multi-step execution, reminders.
