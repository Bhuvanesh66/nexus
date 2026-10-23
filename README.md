# Second Brain: landing page

The public landing page for Second Brain (Airtribe AI Builders Day ’26), built from `product.md`,
`opus_master_prompt.md` and `Second_Brain_Feature_Spec_Designed.md`. The page explains the product with an
interactive demo of the loop the app will run: capture → understand → connect → ask → recall → create.

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

The spec's Google OAuth (Supabase Auth) does not exist in this repository yet. Every "Try Free with Google"
and "Sign in" link points at `SIGN_IN_HREF` in `lib/site.ts`, which resolves to `/sign-in`: a page that says
plainly that sign-in is not connected. To wire the real flow, either set `NEXT_PUBLIC_SIGN_IN_URL` to the
route that calls `supabase.auth.signInWithOAuth`, or replace `app/sign-in/page.tsx` with that route. The
links never prefetch, so a real OAuth start route will not be touched by a prefetch.

## Where things live

| Path | What it is |
| --- | --- |
| `app/page.tsx` | The landing page: hero with the demo, the comparison section, the footer. |
| `app/sign-in/page.tsx` | The honest sign-in placeholder. |
| `components/demo/demo-data.ts` | All demo content: stages and timings, captures, connections, the three tasks and their answers. |
| `components/demo/demo-machine.ts` | The demo state machine (idle, playing, paused, stepped, done; task, answer view, source focus). |
| `components/demo/demo.css` | The demo's styles and its stage timeline (see the comment at the top of the file). |
| `components/demo/SecondBrainDemo.tsx` | The client root: timer, autoplay on view, pause when hidden, controls. |
| `components/demo/DemoSection.tsx` | Server wrapper with the inline script that starts the demo from the beginning without a flash. |
| `components/landing/` | Hero, comparison section, the "Watch the 20-second demo" link, section reveals. |
| `components/site/` | Header and footer. |
| `tests/e2e/landing.spec.ts` | End-to-end checks for the page and every demo interaction. |

How the demo behaves:

- It plays once (about 19 seconds) when it scrolls into view, then rests on the result. It pauses itself when
  scrolled away or when the tab is hidden, and never restarts on its own.
- Pause, Play and Replay, plus a button for each stage, are above the product panel.
- "Try a task" chips (prep for a meeting, draft an email, plan a project) replay ask, recall and create for that
  task; each task recalls a different set of saved captures.
- Pointing at or choosing a capture lights the sentences it produced; the chips in the answer work the other way.
- "With your Brain / Generic AI" compares the answer with and without the user's captures.
- With reduced motion requested, the finished result is shown at once; Play still steps through the stages
  with fades only. Without script, the finished result is what renders.

## Sample content to confirm before launch

All people, notes and numbers inside the demo are illustrative. They follow the briefs, but please confirm or
replace them: Rajesh from Accel and the notes about him; "Our October numbers: 1,240 paying learners, +18% a
month"; the podcast "Seed round prep: what investors check first" (42 min); the saved dates (Jul 18 to Oct 2);
the three generic answers; the footer line "Built for Airtribe AI Builders Day ’26, October 24, 2026".

The page claims no privacy policy, customers, metrics or integrations. Roadmap items from the spec (voice,
WhatsApp, PDF, Gmail execution) are not mentioned as available.
