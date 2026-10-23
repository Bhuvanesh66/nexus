# Nexus: landing page

The public landing page for Nexus (formerly Second Brain; Airtribe AI Builders Day ’26), built from `product.md`,
`opus_master_prompt.md`, `Second_Brain_Feature_Spec_Designed.md` and the Nexus positioning edits. The page
explains the product with an interactive demo of the loop the app will run: drop → absorb → connect → hand off
→ surface → deliver.

Live: https://second-brain-six-swart.vercel.app (Vercel project `second-brain`, deployed from `main` of
`github.com/Bhuvanesh66/nexus`; every push to `main` is a production deploy, other branches get previews).

The demo is a simulation with deterministic sample data. It makes no network calls and needs no API keys.

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

## Sign-in is a placeholder

The spec's Google OAuth (Supabase Auth) does not exist in this repository yet. Every "Try Nexus free" and
"Sign in" link points at `SIGN_IN_HREF` in `lib/site.ts`, which resolves to `/sign-in`: a page that says
plainly that sign-in is not connected. To wire the real flow, either set `NEXT_PUBLIC_SIGN_IN_URL` to the
route that calls `supabase.auth.signInWithOAuth`, or replace `app/sign-in/page.tsx` with that route. The
links never prefetch, so a real OAuth start route will not be touched by a prefetch.

## Where things live

| Path | What it is |
| --- | --- |
| `app/page.tsx` | The landing page: hero with the demo, Why now, the comparison, the three eras, the footer. |
| `app/sign-in/page.tsx` | The honest sign-in placeholder. |
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

Claims that come from the positioning edits and should be checked before launch:

- The three Why now figures and their sources (Indeed 2026: 919% creator economy growth in India, 2020 to
  early 2026; Kalaari Capital: 80M creators in India; BCG 2025: $1T+ creator-influenced spending by 2030).
- "No credit card. Free during beta."
- The composer placeholder and the Drop step invite reels, voice notes and screenshots, and the demo now
  drops an Instagram reel and sends applications on the visitor's behalf. `product.md` lists Instagram, voice
  and autonomous execution as roadmap, not MVP. The demo is labelled as a demo; the hero's last line still
  names what works today.

The page claims no privacy policy, customers or integrations.
