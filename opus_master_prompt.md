Master Build Prompt for Claude Code / Opus --- Second Brain Landing Page
You are the senior product designer, frontend engineer, motion designer,
and QA owner for the Second Brain landing page. Build a
production-quality, interactive landing page that explains the product
primarily through a visual, animated product demonstration.
Source of truth
1. Read product.md completely before coding. Treat it as the product
   and landing-page brief.
2. Inspect the current repository and understand its existing
   framework, routes, package manager, styling, components, and auth
   flow before making changes.
3. Read and apply these Claude Code skills if available:
   - design-taste-frontend
   - web-design-guidelines
   - vercel-react-best-practices
   - playwright-cli
   - deploy-to-vercel only if deployment is explicitly requested
     and authorized. Use the skill mechanism available in the current
     environment (for example, the skill invocation/read command
     supported by Claude Code). Do not assume skill contents; read
     them.
4. Existing project conventions take precedence over a new stack. Do
   not scaffold a second app or replace working infrastructure.
Mission
Create a memorable landing page where someone can understand Second
Brain in seconds: Capture what you learn → connect it to what you
already know → retrieve it for a real task → produce a useful result.

The page should look and feel like a real product, not a static
marketing template. The central animated scene is the main storytelling
device.
Required experience
- Hero headline: "Stop collecting. Start remembering. Start
  doing."
- Supporting copy: "Drop in what you learn. Second Brain connects
  the dots and brings the right insights back when you have something
  real to do."
- Primary CTA: "Try Free with Google", connected to the project's
  real auth route if available. Never fake a successful login.
- Product visual: a polished, responsive, interactive demo panel.
- Demo story: saved investor-related notes become connected knowledge;
  later, a meeting-prep task retrieves those personal notes alongside
  general knowledge and creates a personalized prep brief with visible
  source chips.
- Controls: play/replay, a few task chips (meeting prep, draft email,
  plan a project), and clickable source chips/cards that highlight
  relevant output context.
- A 15--20 second autoplay cycle is acceptable, but it should stop
  when the user interacts and rest on the completed state. Provide
  pause/replay behavior.
- The demo must work without backend credentials using deterministic
  local demo data. If it is simulated, make that clear enough not to
  mislead.
- Make the visual itself explain the product. Do not rely on a large
  paragraph to explain the animation.
Art direction
- Premium, calm, precise, product-led.
- Light background, dark text, restrained indigo accent around
  #4F46E5.
- Clear typography and hierarchy, generous spacing, crisp cards,
  restrained borders/shadows.
- Avoid generic AI landing page tropes: giant gradient blobs, neon
  glows, random floating orbs, excessive glassmorphism, meaningless
  particle effects, fake dashboards, and motion that does not teach
  the product story.
- Desktop: keep hero, CTA, and demo visible above the fold at common
  laptop sizes. Mobile: stack naturally and do not clip content just
  to preserve a no-scroll desktop layout.
- Motion should have meaning: capture card arrives, understanding
  state appears, related nodes connect, relevant memories illuminate,
  context flows into the task, final answer appears with source
  references.
- Respect prefers-reduced-motion; maintain a complete understandable
  experience without continuous animation.
Engineering rules
- Use the existing framework and styling system.
- Prefer typed, state-driven components and a small explicit demo
  state machine rather than scattered booleans.
- Use CSS transforms/opacity for motion where possible. Reuse
  installed animation dependencies; do not add a large dependency
  without a strong reason.
- Keep the demo isolated into maintainable components.
- Use semantic HTML, real buttons, keyboard interaction, visible
  focus, accessible labels, sufficient contrast, and responsive
  layouts.
- Avoid hydration mismatches, layout shift, excessive client JS,
  memory leaks, and unnecessary dependencies.
- Keep all fake demo data local and deterministic. No fake API calls.
- Do not claim unsupported integrations, voice capture, WhatsApp
  ingestion, PDF capture, native mobile apps, or autonomous execution
  are live.
- Do not add invented testimonials, customer logos, traction figures,
  or unsupported privacy claims.
- Do not rebuild the backend or dashboard for this task. Integrate
  with existing code where practical.
- Do not deploy or change production infrastructure unless explicitly
  authorized.
Work process --- follow in order
1. Inspect: Check repository status, files, package manager,
   framework, existing home route, shared components, styling, auth
   route, scripts, and installed animation/browser tooling. Do not
   overwrite unrelated work.
2. Skill review: Read the listed skills and extract applicable
   requirements before implementation.
3. Plan briefly: Identify the files to modify/create and any
   existing route constraints. Then proceed; do not stop for approval
   unless there is a destructive or genuinely blocking ambiguity.
4. Implement: Build the complete landing page and interactive demo,
   not just a mockup or plan.
5. Verify: Run available lint, typecheck, and production build
   commands. Use Playwright CLI/browser verification if installed. Test
   at desktop and mobile sizes, the CTA, task switching, source
   selection, replay/pause, keyboard focus, reduced-motion behavior,
   and console/network errors.
6. Polish: Fix issues found in verification. Review visual
   hierarchy and spacing at the actual viewport sizes.
7. Report: Summarize the files changed, how the demo behaves,
   checks actually run, and any limitations or follow-up wiring needed.
   Never claim a test passed unless you ran it.
Acceptance criteria
The task is complete only when: - The product story is clear within five
seconds. - The animated scene demonstrates capture → connection →
task-based recall → output. - Personal knowledge is visibly
distinguished from general AI knowledge. - The output visibly references
the knowledge cards that informed it. - Task chips change the simulated
task and result. - The visitor can replay the sequence and
inspect/highlight sources. - The page works responsively, with no
horizontal overflow. - Reduced-motion and keyboard access are handled. -
The CTA uses the real auth flow where one exists. - The existing project
still builds, or any pre-existing blockers are clearly reported.

Begin by reading product.md and the available skills, then inspect the
repository and implement the page end-to-end.