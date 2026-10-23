# Nexus

Nexus, *beyond memory*: drop what you learn, Nexus absorbs it and connects it to what you dropped before, and when
you hand it a task it pulls the fragments that matter, adds general knowledge and does the work. Built for
Airtribe AI Builders Day ’26 from `Nexus-Feature-List.md` (functional spec) and the live landing page (brand).
Product requirements: `PRD.md`. What works and what is blocked: `BUILD_STATUS.md`.

Live: https://second-brain-six-swart.vercel.app (Vercel project `second-brain`, deployed from `main` of
`github.com/Bhuvanesh66/nexus`; every push to `main` is a production deploy, other branches get previews).

- `/` the landing page, with an in-browser demo of the loop (sample data, no network calls).
- `/auth/sign-in` → Google (Supabase Auth) → `/dashboard`: **Drop** (notes, YouTube, articles, posts on X, and
  PDFs or text files dragged in or attached),
  **Hand off** (five output modes, cited sources, Copy, Open in Gmail) and **Your Vault** (search, details,
  connections, delete).
- `/stats` public totals: people signed up, fragments dropped, hand-offs answered.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Checks:

```bash
npm run lint         # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck    # tsc --noEmit
npm run build        # production build, includes Next's type check
npm run test:e2e     # Playwright: desktop, phone and reduced-motion projects (run after a build)
```

`test:e2e` starts `next start` on port 3200 and drives the installed Google Chrome. To use Playwright's own
Chromium instead, run `npx playwright install chromium` and set `PW_CHANNEL=""`.

## Services and configuration

Copy `.env.example` to `.env.local` (or `vercel env pull .env.local`).

| What | Where it is configured | Status |
| --- | --- | --- |
| Supabase project `nexus` (`okiivqojobjwrbncozuf`, Mumbai) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on Vercel | Live; schema from `supabase/migrations/` |
| Google sign-in | Supabase dashboard → Authentication → Sign In / Providers → Google | Live |
| Claude (Haiku 5.5 to summarise, Sonnet 5.5 to write) | `ANTHROPIC_API_KEY`, or `AI_GATEWAY_API_KEY` | Not set yet |
| Embeddings (`text-embedding-3-small`, 1536-d) | `OPENAI_API_KEY`, or `AI_GATEWAY_API_KEY` | Not set yet |

Without Claude, drops are saved with a plain extract labelled "Basic summary" and connections are matched by
shared keywords (and say so); Hand off shows the fragments it would use but does not write. Without
embeddings, retrieval uses the keyword backup only.

**Turn on Google sign-in**

1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.
2. Authorised JavaScript origin: `https://second-brain-six-swart.vercel.app`.
   Authorised redirect URI: `https://okiivqojobjwrbncozuf.supabase.co/auth/v1/callback`.
3. Supabase dashboard → project `nexus` → Authentication → Sign In / Providers → Google: enable, paste the client
   ID and secret, save. The site URL and redirect allow-list are already set (`supabase/config.toml`).

**Turn on the AI**: in Vercel → project `second-brain` → Settings → Environment Variables, add
`ANTHROPIC_API_KEY` and `OPENAI_API_KEY` (Production and Preview), then redeploy. Or add a card to the Vercel team
and set `AI_GATEWAY_API_KEY` (one key for both).

**Database changes**: add a file to `supabase/migrations/`, then `supabase db push` (the CLI is linked to
`nexus`).

## Where things live

| Path | What it is |
| --- | --- |
| `app/page.tsx` | The landing page: hero with the demo, Why now, the comparison, the three eras, the footer. |
| `app/auth/*` | Google sign-in start, OAuth callback, sign-out. `proxy.ts` refreshes the session and guards `/dashboard`. |
| `app/sign-in/page.tsx` | Continue with Google, or a plain explanation when sign-in can't start. |
| `app/dashboard/page.tsx`, `components/app/` | The signed-in app: Drop, Hand off, Your Vault, the fragment dialog. |
| `app/api/capture` | Detect → fetch → Claude summary (8.1) → embed → nearest fragments → Claude connections (8.2) → save. |
| `app/api/ask` | Embed the task → `match_captures` (0.6, top 8) + keyword backup → Claude (8.3/8.4) → cited sources. |
| `app/api/captures` | Vault list, one fragment with its connections, delete. |
| `app/stats/page.tsx` | Public totals via `nexus_stats()`. |
| `lib/ai.ts`, `lib/prompts.ts` | AI providers, and every prompt in one place. |
| `lib/ingest/` | YouTube transcripts, article extraction (Readability), posts on X (oEmbed), the no-AI extract. |
| `supabase/migrations/` | Tables, row-level security, `match_captures`, `keyword_captures`, `nexus_stats`. |
| `components/demo/demo-data.ts` | All demo content: stages and timings, captures, connections, the three tasks and their answers. |
| `components/demo/demo-machine.ts` | The demo state machine (idle, playing, paused, stepped, done; task, answer view, source focus). |
| `components/demo/demo.css` | The demo's styles and its stage timeline (see the comment at the top of the file). |
| `components/demo/SecondBrainDemo.tsx` | The client root: timer, autoplay on view, pause when hidden, controls. |
| `components/demo/DemoSection.tsx` | Server wrapper with the inline script that starts the demo from the beginning without a flash. |
| `components/landing/` | Hero, Why now (sourced figures), comparison, eras, the "See a fragment become work" link, reveals. |
| `components/site/` | Header and footer. |
| `tests/e2e/landing.spec.ts` | End-to-end checks for the page and every demo interaction. |

How the demo behaves:

- The story: an Instagram reel about three accelerators is dropped in and absorbed, then connected to earlier
  fragments. The task "I need to apply to startup accelerators" is handed off. Surface lights up the fragments
  it needs and offers three things Nexus can do, and picks "Apply to all 3 accelerators from the reel".
  Deliver creates the applications, asks "3 drafts ready. Need any refining?", takes the green light ("Go
  ahead"), sends them and ends on "Here. Done. 3 applications sent."
- It plays once (about 21 seconds) when it scrolls into view, then rests on the result. It pauses itself when
  scrolled away or when the tab is hidden, and never restarts on its own.
- Pause, Play and Replay, plus a button for each stage, are above the product panel.
- "Hand it a task" chips (apply to accelerators, draft an email, prep for a meeting) replay hand off, surface
  and deliver for that task; each surfaces a different set of fragments and does different work.
- A line under the step bar names the current step and says what happens in it.
- Pointing at or choosing a fragment lights the sentences it produced; the chips in the answer work the other way.
- "With your Vault / Generic AI" compares the work with what generic AI gives: an answer, and nothing done.
- With reduced motion requested, the finished result is shown at once; Play still steps through the stages
  with fades only. Without script, the finished result is what renders.

## Sample content to confirm before launch

All people, accelerators, notes and numbers inside the demo are illustrative. Please confirm or replace them:
the accelerators Northstar Accelerator, Foundry 100 and Sprint Labs and their deadlines (Oct 31, Nov 4, Nov 8);
the reel link; "Our October numbers: 1,240 paying learners, +18% a month"; the one-liner and team notes; the
mentor Priya; the generic AI answers; the footer line "Built for Airtribe AI Builders Day ’26 — October 24,
Bengaluru". The accelerator names are made up on purpose, so the demo never implies a partnership with a real
programme.

Claims that come from the positioning edits and should be checked before launch: the three Why now figures and
their sources (Indeed 2026, Kalaari Capital, BCG 2025) and "No credit card. Free during beta."

The page claims no customers or integrations. The app says "Your Vault is private. Nexus doesn’t train AI on your data." (spec 10.5).
