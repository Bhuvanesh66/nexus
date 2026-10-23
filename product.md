Second Brain --- Product Context & Landing Page Build Brief
Purpose: This file is the source of truth for Claude Code / Opus
when building the public landing page for Second Brain. Read it before
changing code. The goal is not a generic AI SaaS page: visitors should
understand the product by watching a short, visual, interactive
demonstration.

Event context: Airtribe AI Builders Day '26. The initial product is
a hackathon MVP, so prioritize a polished, believable story and fast
performance over a large marketing site.
1. Product in one minute
What it is
Second Brain is an AI-powered personal knowledge assistant that turns
things people learn into useful context for future work.

People collect useful information from YouTube videos, articles, links,
tweets, and their own notes. That information gets scattered across
apps, bookmarks, and memory. Later, when they need it for a real task,
they cannot remember where it was or what it said. They search again,
reread, and relearn.

Second Brain lets a user dump what they learn, automatically
connects it to related things they have already saved, and later
uses those personal knowledge captures together with an LLM's general
knowledge to help complete a real task.
Core positioning
"We're not another place to store notes. We help you stop having to
remember everything."

One-line pitch: > Stop collecting. Start remembering. Start doing.

Hero support line: > Dump what you learn. We connect it, remember it,
and use it when your next task calls for it.
The three-step product loop
1. DUMP IT --- Paste a YouTube link, article URL, tweet URL, or
   type a note. No folders, tags, or manual organization.
2. WE CONNECT IT --- AI understands the content, extracts the
   useful ideas, and finds meaningful connections to the user's
   existing captures.
3. WE EXECUTE IT --- When the user has a real task, Second Brain
   retrieves relevant personal knowledge, combines it with general
   knowledge, and produces a useful answer or workflow: a prep brief,
   email draft, outline, or action steps.
The core differentiator is the combination of personal knowledge the
user has explicitly taught the product and general AI knowledge,
surfaced at the moment of need and turned into a useful output.
2. A concrete story the landing page must communicate
Use one coherent example across the hero animation. Do not switch
between unrelated examples mid-animation.
Example: preparing for an investor meeting
The user has previously saved several bits of knowledge: - "Rajesh from
Accel prefers numbers over buzzwords." - "Rajesh has invested in two
edtech startups." - "Accel's seed-stage thesis focuses on ambitious,
high-growth companies." - A useful podcast/article about preparing for
seed fundraising.

Later, the user asks: > "I'm meeting Rajesh from Accel tomorrow about
my seed round. Help me prepare."

Second Brain: 1. Retrieves the relevant personal captures. 2. Shows them
visibly connecting to the task. 3. Combines them with general knowledge.
4. Produces a tailored prep brief with context, suggested approach,
risks, and opening lines. 5. Shows the source captures used so the user
can verify where the personal details came from. 6. Optionally switches
the output to a draft email.

The facts above are illustrative demo content, not claims about a real
person. Keep them clearly inside the simulated demo UI.
The "magic moment"
A visitor should see that the product does not merely summarize a
link or give a generic AI answer. It retrieves small things the user
previously saved and applies them to a new task.

Make the contrast visual: - Generic AI: "Here's a standard seed pitch
checklist." - Second Brain: "Lead with traction metrics. Rajesh prefers
numbers over buzzwords. Here are three tailored opening lines." - Show a
small "From your Brain" source chip connected to the specific insight.
3. Target audience and problem
Primary audience
Knowledge workers, students, builders, founders, researchers, and
lifelong learners who consume useful information across many formats but
struggle to apply it later.
Problem
- Useful insights get scattered across YouTube, articles, social
  posts, bookmarks, and notes.
- Traditional note tools require people to organize information
  manually.
- Search tools help find information, but often do not recall the
  user's own context.
- General-purpose AI can answer questions, but usually lacks the
  specific things the user learned and saved over time.
- People repeatedly search, reread, and relearn information they have
  already encountered.
Desired outcome
Users can save information with almost zero effort, trust that relevant
ideas will be found later, and turn what they have learned into action.
Messaging guardrails
- Lead with the user outcome, not "RAG", embeddings, vector databases,
  or AI jargon.
- Do not claim the product has perfect memory, knows everything, or
  automatically connects every item.
- Do not imply integrations or execution actions exist unless they are
  implemented. A landing-page demo may simulate the product loop, but
  label it as an interactive demo if it is not connected to the live
  backend.
- Do not claim voice, WhatsApp, PDF, Instagram, or native mobile
  capture is already available in the MVP. These are roadmap ideas.
- Avoid unverified metrics, testimonials, customer logos, or traction
  numbers.
- Keep privacy claims truthful. If the app does not yet have a
  verified policy, avoid absolute claims such as "your data is never
  used for training."
4. Landing page goals
The landing page is a product demonstration, not a long brochure. It
must quickly answer: 1. What is Second Brain? 2. Why is it different
from notes apps and generic AI chatbots? 3. What happens when I use it?
4. What should I click next?
Primary conversion
Try Free with Google / Try Second Brain. Wire this to the
existing authentication flow if one exists. If auth is not yet
available, use the project's existing sign-in route or a clearly named
placeholder CTA; do not fabricate successful sign-in.
Supporting conversion
A clear "Watch the 20-second demo" or "Try the demo" interaction can
scroll/focus to or start the product visual. Do not add competing
primary CTAs.
Page shape
The original MVP spec calls for a one-screen landing page with no long
scroll. Preserve that principle on desktop: the headline, CTA, and main
product visualization should be visible above the fold at common laptop
sizes. A small amount of responsive vertical overflow is acceptable on
short screens and mobile; do not clip important content to force a
no-scroll rule.
5. Visual and interaction direction
Overall feeling
Premium, calm, precise, and product-led. The page should feel like a
thoughtful AI tool, not a generic "AI magic" template.
Design baseline from the product spec
- Light background, dark text, restrained deep-indigo accent (around
  #4F46E5).
- Clean sans-serif/system typography.
- Generous spacing and readable contrast.
- Rounded controls, subtle borders and shadows.
- Avoid gratuitous gradients, neon glows, noisy backgrounds, floating
  blobs, or excessive glassmorphism.
- Use motion to explain the product, not merely decorate it.
The main visual should explain the loop
Build a large, custom, animated product scene. It can look like a real
app interface with connected cards and a task panel. The visitor should
understand the product even if they do not read the supporting copy.
Suggested visual layout
A responsive hero: - Left or top: eyebrow ("YOUR KNOWLEDGE, PUT TO
WORK"), headline, short explanation, CTA and quiet trust note. - Right
or below: interactive "Second Brain in action" panel. - On desktop, use
a balanced two-column layout; on mobile, stack the text and demo without
horizontal overflow.
Demo stages
Use a state-driven sequence with clear labels and a visible progress
indicator: 1. Capture --- a YouTube/article/note card enters the
system. 2. Understand --- title, summary, and takeaway appear with a
subtle typing/reveal effect. 3. Connect --- the new capture links to
two or three existing knowledge cards. Animate connection lines/dots
drawing between cards. 4. Ask --- a task prompt appears: "Help me
prepare for my meeting with Rajesh from Accel." 5. Recall ---
relevant personal knowledge cards illuminate and move/flow toward the
task. 6. Create --- a prep brief is assembled with visibly cited
source chips ("From your Brain") and a final output card.

Keep each stage understandable for a first-time visitor. Do not make the
animation so fast that labels cannot be read.
Active interaction
The visual must not be only a passive loop: - Provide a clear "Play
demo" / "Replay" control. - Provide "Try a task" or a few small task
chips (e.g., "Prep for a meeting", "Draft an email", "Plan a project").
Clicking a chip should update the simulated task and resulting output. -
Allow pause/resume or replay if feasible. - Use meaningful hover/focus
states on source cards and connection chips. Hovering or selecting a
source should briefly highlight the related insight in the final
output. - Make the "personal knowledge" vs "general AI knowledge"
distinction visually obvious. - The interactive demo must work without
API keys or a backend by using deterministic mock content. Clearly
present it as a demo/simulation if it is not using the live product
backend. - Respect prefers-reduced-motion. Reduced-motion users should
get the same explanation through static state changes and transitions
without continuous motion. - Ensure keyboard accessibility: buttons are
real buttons, focus is visible, and interactive chips have accessible
labels.
Motion language
Use restrained, polished motion: - cards fade/slide in with small
distances; - source nodes pulse once when selected; - connector paths
draw or reveal; - progress steps advance; - result text reveals in short
chunks, not character-by-character for long paragraphs; - CTA hover/tap
feedback is subtle. Avoid endless spinning, distracting bouncing, huge
parallax, or animations that reduce legibility.
Loop behavior
The scene can auto-play a single 15--20 second cycle and then rest on
the completed result. Do not constantly reset while someone is reading.
Include replay and pause controls. If a visitor interacts with a task
chip, stop the auto-loop and give control to the visitor.
6. Copy direction
Recommended copy
Eyebrow: > YOUR KNOWLEDGE, PUT TO WORK

Headline: > Stop collecting. Start remembering. Start doing.

Subhead: > Drop in what you learn. Second Brain connects the dots and
brings the right insights back when you have something real to do.

Primary CTA: > Try Free with Google

Secondary interaction: > Watch the 20-second demo

Small note: > No folders. No manual tagging. Just save it and get back
to work.

Optional short differentiator beneath the visual: > Not just what AI
knows. What you've learned, too.
Copy principles
- Use short, concrete language.
- Describe actions and outcomes.
- Keep technical terms out of the hero.
- Do not use fake user quotes or invented stats.
- Do not overstate autonomous execution. Say "drafts", "prepares", or
  "helps you take the next step" unless a specific action is genuinely
  wired up.
7. Technical implementation expectations
First action: inspect the existing project
Before editing, inspect the repository, existing routes, package
manager, installed dependencies, design tokens, auth flow, and current
landing page. Preserve the existing stack and conventions. Do not
scaffold a new app if one already exists.
Required Claude Code frontend skills
Use these installed skills if available in the current Claude Code
environment, reading their full instructions before implementation: -
design-taste-frontend - web-design-guidelines -
vercel-react-best-practices - deploy-to-vercel - playwright-cli

Do not merely mention the skills. Apply them: - design-taste-frontend:
visual quality, hierarchy, details, interaction polish. -
web-design-guidelines: accessibility, semantics, responsive behavior,
and UI quality checks. - vercel-react-best-practices: component
architecture, rendering and performance decisions. - deploy-to-vercel:
use only if deployment is requested/authorized and project setup
supports it. - playwright-cli: use for browser verification and
responsive/interaction checks if installed and configured.

If a skill is missing, continue with sound engineering judgment and
state the limitation rather than inventing skill instructions.
Stack preferences
Follow the existing repo. If it is a Next.js project, prefer App Router
conventions and TypeScript. Use the project's existing styling system
(Tailwind/shadcn if already installed). Prefer CSS transforms/opacity
for animation. Use an existing animation library if installed; otherwise
CSS animations and a small state machine are enough. Do not install a
large dependency just for a decorative effect.
Architecture
- Keep the landing page components small and composable.
- Separate the animated demo scene from the hero copy.
- Represent demo stages and task variants as typed data/state, not
  scattered booleans.
- Use deterministic local demo data; do not make fake network calls.
- Keep the visual responsive and testable.
- Use semantic HTML and accessible labels.
- Avoid hydration mismatches, layout shift, and unnecessary
  client-side JavaScript.
- Avoid loading heavy video assets if CSS/SVG/UI animation can tell
  the story more clearly.
- If using SVG connector lines, keep controls outside the SVG and
  ensure connectors do not block clicks.
- Clean up animation timers/listeners correctly if any are used.
Performance
- Keep the initial page fast on mobile and a normal 4G connection.
- Avoid large libraries and oversized assets.
- Animate transform and opacity where possible.
- Do not animate expensive layout properties continuously.
- Lazy-load nonessential content.
- Ensure fonts do not block first paint.
- Avoid excessive blur filters and large animated shadows.
8. Required implementation checklist
Product story
- [ ] A first-time visitor can explain "capture → connect → use" after
  watching the visual.
- [ ] The demo clearly shows personal knowledge being recalled for a
  later task.
- [ ] The result differs from a generic AI response and includes
  visible source chips.
- [ ] The demo does not imply unavailable features are already live.
UI
- [ ] Headline, short subhead, primary CTA, and product demo are
  visible above the fold on a common desktop viewport.
- [ ] Layout adapts cleanly to mobile and tablet.
- [ ] No horizontal overflow.
- [ ] No fake logos, fake testimonials, or unverified metrics.
- [ ] Consistent typography, spacing, borders, and accent color.
- [ ] Loading/active/completed states are visually distinct where
  relevant.
Interactions
- [ ] Demo plays and can be replayed.
- [ ] Task chips change the task and output.
- [ ] Source selection highlights related context in the output.
- [ ] All controls work with keyboard and show focus states.
- [ ] Reduced-motion preference is respected.
- [ ] Interaction does not accidentally trigger auth or make
  unsupported claims.
Quality
- [ ] Run the project's lint/typecheck/build commands that exist.
- [ ] Use Playwright/browser tools if available to check desktop and
  mobile.
- [ ] Check console errors and failed requests.
- [ ] Test CTA routing.
- [ ] Confirm animations do not cause layout shifts or obscure text.
- [ ] Report files changed, checks run, and any remaining issues
  honestly.
9. Scope boundaries
This task is the landing page and its interactive product
demonstration. Do not rebuild the full application, database, auth,
ingestion, retrieval, or execution backend unless explicitly asked.
Integrate with existing routes and components where possible.

If the full dashboard does not exist yet, build a self-contained,
deterministic interactive demo that communicates the product story. Do
not block the landing page on backend work.

Do not deploy, change DNS, add secrets, or modify production
infrastructure without explicit authorization.
10. Definition of done
The landing page is done when: 1. The value proposition is obvious
within five seconds. 2. The animated scene makes the product's core loop
understandable without reading a long explanation. 3. The user can
interact with the demo and see a different task/output. 4. The design
feels intentional and polished rather than template-generated. 5. The
page is responsive, accessible, performant, and free of obvious
console/build errors. 6. The primary CTA follows the project's real
sign-in flow or clearly identifies what remains to be wired up. 7.
Claude Code reports the actual checks performed and any known
limitations.