NEXUS -Feature Spec for Build

Oct 23, 2026 · Owner @Hardik · For: tech collaborator · Target: Airtribe AI Builders Day '26 (Oct 24, 2026)


## **TL;DR — Read This First**

**What we're building:** A chatbot-style web app where users dump anything they learn (links, text, voice notes later) → AI understands it, connects it to what they already dumped → when they later have a real task, they ask the app and it suggests workflows pulling from LLM's general knowledge **PLUS everything the user has personally taught it**, then executes the chosen workflow for them.

**One sentence pitch:** _Claude on steroids that you can train — reduces the need to remember little things by storing them in a connected way and retrieving them exactly when the task demands it._

**What this doc gives you (the builder):**

1. The exact user flow — so you know what the end experience must feel like.

2. The must-have feature list — scoped for 12-hour hackathon shipping.

3. The tech stack recommendation — chosen for speed, not elegance.

4. The data model — ready to paste into Supabase.

5. The build order — so you don't waste time building things in wrong sequence.

6. The LLM prompts — pre-written for you to drop in.

7. The demo script — so you build for the moments judges will see.

**Hard constraints:**

- Must ship a working deployed URL in <36 hours of build time.

- Must demo 3 magic moments live without crashing.

- Must handle at least YouTube link ingestion + text ingestion + task-based retrieval + one execution output.

- Budget: free tiers only, except Claude API (<$20 total).


## **1. What We're Building (Explained Simply)**

**Imagine this:**

You learn 10 small things every day. A trick from an Instagram reel. A fact from a YouTube video. A tip someone casually told you about a specific person. A random article you read. A workflow a friend showed you.

**Right now:** All of that disappears. Three months later when you actually need it, you don't remember you learned it. You re-google. You re-learn. You waste time.

**Second Brain fixes that in 3 steps:**

1. **DUMP IT** — Whenever you learn something, just paste the link or type it into our app. Like texting a chatbot. No folders. No tags. No work.

2. **WE CONNECT IT** — Our AI reads what you dumped, understands it, finds everything else you've dumped that relates to it, and quietly stitches it all together. One connected web of your personal knowledge.

3. **WE EXECUTE IT** — Later, when you have a real task (write an email, prep for a meeting, make a decision, build something), you just tell our app the task. It thinks like Claude or ChatGPT would — BUT ALSO pulls in everything YOU specifically taught it — and gives you a workflow. You pick one. It does it.

**The one-line difference from everything else out there:**

_We are NOT a memory tool. We are a stop-having-to-remember tool. You offload what you learn. We give it back exactly when the task needs it — and then we do the task with you._

**Real example (keep this in mind while building):**

Hardik meets 5 investors a month. He learns small things about each one — this VC likes natural wine, that one's son just started college, this one hates buzzwords. He dumps each note into Second Brain as he learns it.

6 months later, he has a meeting with VC #3. He tells Second Brain: _"I'm meeting Rajesh from Accel tomorrow about my seed round."_

Second Brain pulls:

- From user's past dumps: _"Rajesh hates buzzwords, prefers numbers. His son just started at BITS. He personally invested in two edtech startups in 2025."_

- From LLM general knowledge: _"Standard seed pitch deck structure, Accel's typical check size, their recent India investments."_

- Combines both into a prep brief + a draft agenda + 3 personalised ice-breaker options.

That's the unfair advantage we're selling.

**If you (the builder) remember only ONE thing from this doc: the magic is in combining the user's personal knowledge dumps with the LLM's general brain, and surfacing both exactly when the user has a real task to execute.**


## **2. Core User Flow (Step by Step)**

This is the exact flow the app must support. Build to this.


### **Flow A — The Dump Flow (user teaches the app)**

1. User lands on homepage → signs in with Google (one click).

2. Lands on dashboard. Sees a chat-like interface. Big input box at top. A sidebar/list showing everything they've already dumped.

3. User pastes something into the input:

- A YouTube link

- A plain text note ("VC Rajesh from Accel hates buzzwords, prefers numbers")

- An article URL

- A tweet URL

4. User hits Send.

5. App shows a loading state: _"Reading… Understanding… Connecting to what you've already taught me…"_

6. Backend does:

- a. Detects content type (YouTube / URL / text / tweet)

- b. If link → fetches the content (transcript for YouTube, article text for URLs)

- c. Sends full content to Claude with a _summarise + extract entities + extract key insights_ prompt

- d. Generates a vector embedding of the summary

- e. Searches the user's existing captures for semantically similar ones (top 5)

- f. Sends the new capture + those 5 similar captures to Claude with a _find connections_ prompt

- g. Stores the capture + its embeddings + its connections to other captures in the database

7. App returns a confirmation card: _"Got it. I've connected this to \[3 things you already told me]: \[list of titles]."_ User sees the knowledge grow.


### **Flow B — The Ask Flow (user uses the app)**

1. User clicks the "Ask" tab (or just types in the main input — app auto-detects it's a question/task, not a dump).

2. User types a task in natural language: _"I have a meeting with Rajesh from Accel tomorrow about seed round. Help me prep."_

3. User selects an **Output Mode** from a dropdown: Answer / Draft Email / Make Outline / Action Steps / Full Prep Brief.

4. User hits Ask.

5. App shows: _"Thinking… Checking what you've taught me about this… Combining with general knowledge…"_

6. Backend does:

- a. Generates an embedding of the user's task

- b. Does vector search in Supabase: top 8-10 most semantically relevant captures from THIS user's data only

- c. Also does entity extraction on the task (names, companies, keywords) and does a keyword search as a backup

- d. Sends to Claude: user's task + the retrieved captures (as context labelled "Here's what the user has personally learned on this topic") + instruction to produce output in the requested Mode

- e. Claude's response is formatted and returned

7. App displays:

- The output (big, scannable)

- A "Sources" collapsible section showing which captures were used (so user trusts it)

- A "Copy" button

- An "Execute this" button (for Modes like Draft Email → opens Gmail compose with the draft prefilled, if we build that integration)


### **Flow C — The Review Flow (user browses what the brain knows)**

1. User clicks "My Brain" / Library tab.

2. Sees a chronological or topic-grouped list of all captures.

3. Each capture shows: title, source (YouTube link / URL / text), one-line summary, date, connected-to count.

4. Click a capture → see full summary, keywords, connections (links to other related captures).

5. Can delete a capture (right-click or 3-dot menu).

**These three flows = the entire product for the hackathon. Nothing else.**


## **3. Must-Have Features (Hackathon MVP)**

Every feature below is non-negotiable for the demo. If something below is too hard, pause and tell the team before cutting it.


### **3.1 Authentication**

- **F1.1** Google OAuth sign-in. One click. No email/password.

- **F1.2** User session persists across refresh.

- **F1.3** Each user's data is private and isolated (row-level security on all tables).


### **3.2 Capture / Ingestion**

- **F2.1** YouTube link ingestion:

* Detect YouTube URLs (youtube.com, youtu.be, shorts, embed formats).

* Fetch transcript using youtube-transcript-api (Python) or equivalent JS library.

* If no transcript available, show friendly error and offer to let user paste their own summary.

- **F2.2** Plain text ingestion:

* User types/pastes any free text up to 10,000 characters.

* Treated as the raw content directly.

- **F2.3** Generic URL ingestion:

* Any https\:// URL that isn't YouTube.

* Fetch page HTML, strip to main article text (use readability-js or similar).

* If paywalled/blocked, show friendly error.

- **F2.4** Capture pipeline (runs for every ingestion):

* a. Send raw content to Claude → get back: {title, summary\_200w, keywords\[], entities\[], one\_line\_takeaway}.

* b. Generate embedding of summary using OpenAI text-embedding-3-small OR Voyage AI (whichever has free credits).

* c. Vector search for top 5 semantically similar existing captures from this user.

* d. Send Claude the new capture + the 5 candidates with prompt: _"Which of these are genuinely related to the new one? Return the IDs and a one-sentence reason for each."_

* e. Save new capture + its connections to database.

- **F2.5** Capture confirmation UI:

* Within 60 seconds show: title, one-line takeaway, and _"Connected to: \[list of 1-3 related captures]"_ with clickable links.


### **3.3 Retrieval / Ask**

- **F3.1** Natural language input box for task/question.

- **F3.2** Output Mode selector dropdown (5 modes): Answer / Draft Email / Make Outline / Action Steps / Full Prep Brief.

- **F3.3** Retrieval pipeline:

* a. Generate embedding of the user's task.

* b. Vector search top 8 captures with similarity > threshold (e.g. 0.6).

* c. Extract named entities from the task; keyword-search captures mentioning them; merge with semantic results (dedupe by ID).

* d. Build prompt with user's task + retrieved captures (clearly labelled: \[FROM USER'S PERSONAL KNOWLEDGE]) + the Mode-specific instruction.

* e. Call Claude. Return response.

- **F3.4** Response UI:

* Response rendered in a clean card (markdown-aware).

* "Sources" collapsible section showing which captures contributed.

* "Copy" button for the whole response.

* For Draft Email Mode: a "Open in Gmail" button (sends to Gmail compose URL with subject + body prefilled — no auth needed).


### **3.4 Library / My Brain**

- **F4.1** List view of all captures, newest first.

- **F4.2** Each row shows: title, source icon (YouTube/web/text), one-line takeaway, date.

- **F4.3** Click a row → modal/detail view with: full summary, keywords, source link, list of connected captures (clickable).

- **F4.4** Delete capture (with confirmation).

- **F4.5** Simple keyword search bar at top (searches titles, summaries, keywords).


### **3.5 Landing Page (public, pre-login)**

- **F5.1** One-screen landing. No scroll. Headline + 20-sec looping GIF of the magic + "Try Free" CTA.

- **F5.2** Headline: _"Stop collecting. Start remembering. Start doing."_

- **F5.3** CTA triggers Google sign-in → lands user on dashboard.


### **3.6 Minimum Production-Ready Qualities**

- **F6.1** Deployed to a public HTTPS URL (not localhost).

- **F6.2** Works on mobile viewport (even if not pretty — must not break).

- **F6.3** Loading states on every async action (no silent spinners).

- **F6.4** Friendly error messages (no raw stack traces).

- **F6.5** Session doesn't crash if Claude API is slow — show "still thinking…" with option to cancel.


### **3.7 Analytics / Observability (bare minimum)**

- **F7.1** Log every capture + every ask (to Supabase table). This gives us demo-day metrics: # users signed up, # captures made, # asks answered. These are what we show judges.

- **F7.2** A /stats route (public) showing live counts — makes judges feel momentum.


## **4. Technical Architecture & Stack**

_(This is a recommendation. If the tech person has strong opinions, defer to them — but these are picked specifically for speed in 36 hours.)_


### **4.1 Stack Overview**

| Layer              | Tool                                                                                     | Why                                                           |
| ------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Frontend + Backend | Next.js 14+ (App Router) on Replit                                                       | One codebase, fastest to ship with Replit Agent               |
| Auth               | Supabase Auth (Google OAuth)                                                             | Zero config, free, built-in RLS                               |
| Database           | Supabase Postgres                                                                        | Free tier, hosted, SQL + pgvector in one                      |
| Vector store       | Supabase pgvector extension                                                              | No separate DB needed, free                                   |
| LLM                | Anthropic Claude API (claude-sonnet-4 for retrieval synth, claude-haiku-4 for summaries) | Hackathon likely gives Claude credits; cost control via Haiku |
| Embeddings         | OpenAI text-embedding-3-small OR Voyage AI                                               | Cheap, fast, 1536 dim vectors                                 |
| YouTube transcript | youtube-transcript-api (Python) or youtube-transcript (npm)                              | Free, no auth                                                 |
| URL scraping       | @mozilla/readability + jsdom                                                             | Strips articles to clean text                                 |
| Hosting            | Replit Deployments (public URL)                                                          | One-click deploy                                              |
| Secrets            | Replit Secrets panel                                                                     | Keep API keys out of code                                     |


### **4.2 System Flow Diagram (text version)**

\[User's browser]\
        │\
        │  (Google OAuth)\
        ▼\
\[Next.js app on Replit]\
        │\
        ├──► POST /api/capture\
        │        │\
        │        ├──► Detect type (YouTube / URL / text)\
        │        ├──► Fetch content\
        │        ├──► Claude Haiku: summarise + extract\
        │        ├──► OpenAI: embed summary → vector\
        │        ├──► Supabase: pgvector search top 5\
        │        ├──► Claude Haiku: find real connections\
        │        └──► Supabase: insert capture + links\
        │\
        ├──► POST /api/ask\
        │        │\
        │        ├──► OpenAI: embed task → vector\
        │        ├──► Supabase: pgvector top 8 + keyword search\
        │        ├──► Build prompt (task + captures + mode)\
        │        ├──► Claude Sonnet: synthesize answer\
        │        └──► Return to UI\
        │\
        └──► GET /api/captures (list for Library)


### **4.3 Key External Dependencies**

- Anthropic API key (from console.anthropic.com) — $5 credit to start, more via hackathon credits.

- OpenAI API key (for embeddings only) — \~$1 for 10,000 embeddings. Alternative: Voyage AI free tier.

- Supabase project — free tier covers up to 500MB DB and 50MB file storage.

- Google OAuth client (set up inside Supabase Auth dashboard — Supabase docs walk through it).


### **4.4 Repository Structure (suggested)**

/app\
  /api\
    /capture/route.ts       → ingestion endpoint\
    /ask/route.ts           → retrieval + synth endpoint\
    /captures/route.ts      → list for Library\
    /auth/callback/route.ts → OAuth callback\
  /dashboard/page.tsx       → main app (chat + library tabs)\
  /page.tsx                 → landing page\
/lib\
  /claude.ts                → Claude API wrapper\
  /embeddings.ts            → OpenAI embedding wrapper\
  /supabase.ts              → Supabase client (server + browser)\
  /youtube.ts               → transcript fetcher\
  /scrape.ts                → URL article extractor\
  /prompts.ts               → all LLM prompts in one place\
/components\
  /CaptureInput.tsx\
  /CaptureCard.tsx\
  /AskPanel.tsx\
  /LibraryList.tsx


## **5. Data Model (Supabase Schema)**

Paste these SQL statements directly into Supabase SQL Editor. Enable the vector extension first.


### **5.1 Setup**

\-- Enable pgvector\
create extension if not exists vector;


### **5.2 Tables**

\-- Captures (the user's dumped knowledge)\
create table captures (\
  id uuid primary key default gen\_random\_uuid(),\
  user\_id uuid not null references auth.users(id) on delete cascade,\
  type text not null check (type in ('youtube', 'url', 'text', 'tweet')),\
  source\_url text,\
  raw\_content text not null,\
  title text not null,\
  summary text not null,\
  one\_line\_takeaway text not null,\
  keywords text\[] default '{}',\
  entities text\[] default '{}',\
  embedding vector(1536),\
  created\_at timestamptz default now()\
);\
\
create index captures\_user\_idx on captures(user\_id);\
create index captures\_embedding\_idx on captures\
  using ivfflat (embedding vector\_cosine\_ops) with (lists = 100);\
create index captures\_keywords\_idx on captures using gin (keywords);\
create index captures\_entities\_idx on captures using gin (entities);\
\
\-- Connections between captures\
create table capture\_links (\
  id uuid primary key default gen\_random\_uuid(),\
  user\_id uuid not null references auth.users(id) on delete cascade,\
  from\_capture\_id uuid not null references captures(id) on delete cascade,\
  to\_capture\_id uuid not null references captures(id) on delete cascade,\
  reason text,\
  created\_at timestamptz default now(),\
  unique(from\_capture\_id, to\_capture\_id)\
);\
\
create index capture\_links\_from\_idx on capture\_links(from\_capture\_id);\
create index capture\_links\_to\_idx on capture\_links(to\_capture\_id);\
\
\-- Ask log (for analytics + demo-day metrics)\
create table asks (\
  id uuid primary key default gen\_random\_uuid(),\
  user\_id uuid not null references auth.users(id) on delete cascade,\
  task text not null,\
  mode text not null,\
  response text,\
  used\_capture\_ids uuid\[],\
  created\_at timestamptz default now()\
);


### **5.3 Row-Level Security (CRITICAL — do not skip)**

alter table captures enable row level security;\
alter table capture\_links enable row level security;\
alter table asks enable row level security;\
\
create policy "users see own captures"\
  on captures for all\
  using (auth.uid() = user\_id)\
  with check (auth.uid() = user\_id);\
\
create policy "users see own links"\
  on capture\_links for all\
  using (auth.uid() = user\_id)\
  with check (auth.uid() = user\_id);\
\
create policy "users see own asks"\
  on asks for all\
  using (auth.uid() = user\_id)\
  with check (auth.uid() = user\_id);


### **5.4 Vector Search Function**

create or replace function match\_captures (\
  query\_embedding vector(1536),\
  match\_threshold float,\
  match\_count int,\
  for\_user uuid\
)\
returns table (\
  id uuid,\
  title text,\
  summary text,\
  one\_line\_takeaway text,\
  keywords text\[],\
  entities text\[],\
  source\_url text,\
  similarity float\
)\
language sql stable\
as $$\
  select\
    c.id, c.title, c.summary, c.one\_line\_takeaway,\
    c.keywords, c.entities, c.source\_url,\
    1 - (c.embedding <=> query\_embedding) as similarity\
  from captures c\
  where c.user\_id = for\_user\
    and 1 - (c.embedding <=> query\_embedding) > match\_threshold\
  order by c.embedding <=> query\_embedding\
  limit match\_count;\
$$;


## **6. User Interface Specification**

Fast, clean, chat-first. Keep it close to Claude.ai's own aesthetic — it's familiar and judges trust it.


### **6.1 Landing Page (/)**

Single screen. No scroll.

- **Top:** Minimal nav. Logo on left (just text, "Second Brain"). "Sign in" button on right.

- **Hero:** Centered.

* H1 (large, bold): _"Stop collecting. Start remembering. Start doing."_

* Subhead (muted): _"Dump what you learn. We connect it, remember it, and use it when your next task calls for it."_

* Primary CTA button: _"Try Free with Google"_ → triggers OAuth.

* Below CTA: _"No credit card. Free during beta."_

- **Below hero:** One looping GIF/MP4 (max 20 sec) showing the full magic cycle: dump → connect → ask → execute. Build this GIF Saturday morning with Loom.


### **6.2 Dashboard (/dashboard) — Main App**

Two-column layout on desktop, stacked on mobile.

**Top bar:**

- Logo (left)

- Three tab links: Dump | Ask | My Brain

- User avatar (right, dropdown with Sign Out)

**Center (changes based on tab):**


#### **Tab 1: Dump**

- Large input box (textarea, auto-grows). Placeholder: _"Paste a link, type a note, dump anything you just learned…"_

- Below input: a Send button (dark, prominent).

- Below: last 5 captures shown as cards (small, grey). Clicking expands.

- Loading state: skeleton shimmer on new capture card while processing.

- Success state: new capture card slides in from top with green border, showing: title + takeaway + "Connected to: \[list]".


#### **Tab 2: Ask**

- Large input box. Placeholder: _"What do you want to do? e.g., 'Help me prep for my meeting with Rajesh tomorrow'"_

- Below input, three controls in a row:

* Output Mode dropdown (default: Full Prep Brief)

* "Ask" button

- Below: history of past asks (collapsible cards, newest on top). Each shows the task, the output, and the sources used.

- Loading state: typing-dots animation + text _"Checking what you've taught me…"_


#### **Tab 3: My Brain**

- Search bar at top (keyword search across titles/summaries/keywords).

- Below: scrollable list of captures. Each row:

* Source icon (▶ YouTube / 🌐 URL / 📝 text / 🐦 tweet)

* Title (bold)

* One-line takeaway (muted)

* Keywords as small tags

* Date (right-aligned)

* 3-dot menu (view / delete)

- Click row → modal: full summary, keywords, source link (opens in new tab), connected captures (clickable).


### **6.3 Visual Design Rules**

- Typography: System font stack (-apple-system, BlinkMacSystemFont, sans-serif). Clean, no fancy fonts.

- Colors: White background, dark text (#111), one accent color (deep indigo #4F46E5 or similar). No gradients.

- Spacing: Generous padding. Nothing cramped.

- Buttons: Rounded corners (6-8px), subtle shadows on hover.

- Mobile: Stack everything vertically. Hide the "My Brain" tab under a drawer menu if needed.


### **6.4 Micro-interactions (small details judges notice)**

- When a capture is processing, show the stages one by one: _"Reading… ✓ Understanding… ✓ Connecting…"_

- When a connection is found, show it as a small pill: _"🔗 Related to 'How Rohan uses Notion'"_

- When an ask returns, the sources count animates up: _"3 memories used"_

- Little details like this are what make the demo feel polished without taking extra time.


## **7. Build Order (The Sequence That Won't Break You)**

Follow this order strictly. Each phase ends with a working, demoable state. Do not jump ahead — a broken foundation kills everything.


### **Phase 0 — Setup (2-3 hours)**

1. Create accounts: Replit, Supabase, Anthropic Console, OpenAI (for embeddings).

2. Replit: create a Next.js (TypeScript, App Router) project.

3. Supabase: create project, run the SQL from Section 5 (all of it).

4. Set up Supabase Auth: enable Google provider, add OAuth client credentials from Google Cloud Console.

5. Add API keys to Replit Secrets: ANTHROPIC\_API\_KEY, OPENAI\_API\_KEY, SUPABASE\_URL, SUPABASE\_ANON\_KEY, SUPABASE\_SERVICE\_ROLE\_KEY.

6. Install npm deps: @supabase/supabase-js, @anthropic-ai/sdk, openai, youtube-transcript, @mozilla/readability, jsdom.

**Milestone 0 ✓:** Project boots. Auth placeholder page works.


### **Phase 1 — Auth + Shell (2 hours)**

1. Build / landing page (basic, just the hero + CTA button).

2. Build /dashboard as an empty authed-only page.

3. Hook up Google OAuth via Supabase client. Sign in → redirects to /dashboard.

4. Build the top bar + 3 tabs (Dump / Ask / My Brain), tabs just show placeholder for now.

**Milestone 1 ✓:** User can sign in and see the empty dashboard.


### **Phase 2 — Capture Pipeline (6 hours — the hardest part, do this first)**

1. Build /api/capture POST endpoint.

2. Implement content fetchers: fetchYouTubeTranscript(url), scrapeArticle(url), raw text pass-through.

3. Implement claudeSummarize(content) → returns {title, summary, one\_line\_takeaway, keywords, entities}.

4. Implement embed(text) → OpenAI embedding → vector.

5. Implement findSimilarCaptures(userId, embedding) → calls match\_captures SQL function → top 5.

6. Implement claudeFindConnections(newCapture, candidates) → returns list of IDs that are actually related + a reason.

7. Save capture + connections to DB in a transaction.

8. On the Dump tab, build the input UI + Send button that calls /api/capture and shows the result.

9. Test with 10 YouTube videos, 5 articles, 5 text notes. Fix issues.

**Milestone 2 ✓:** User can dump content and see it absorbed + connected. The core engine works.


### **Phase 3 — Ask / Retrieval (4 hours)**

1. Build /api/ask POST endpoint.

2. Embed the user's task.

3. Vector search for top 8 captures.

4. Entity-extract the task (simple regex or Claude call) and keyword-search as backup.

5. Merge, dedupe, format captures into a prompt.

6. Build mode-specific prompts (see Section 8).

7. Call Claude Sonnet, return response + used capture IDs.

8. Build the Ask tab UI: input + mode dropdown + response card + sources accordion.

9. For Draft Email mode: build the "Open in Gmail" button that constructs a https\://mail.google.com/mail/?view=cm\&su=\<subject>\&body=\<body> URL.

**Milestone 3 ✓:** User can ask a task and get an answer that visibly draws from their dumps. This is the money moment.


### **Phase 4 — Library (2 hours)**

1. Build /api/captures GET endpoint (list for current user).

2. Build My Brain tab: list of captures + detail modal.

3. Add delete capture functionality.

4. Add keyword search bar.

**Milestone 4 ✓:** User can browse everything they've taught the app.


### **Phase 5 — Polish + Demo Prep (4 hours)**

1. Record the 20-sec landing GIF (dump → connect → ask → execute).

2. Pre-populate 2 demo accounts with 15-20 captures each on 2 themes (e.g., investor-prep content for one, learning-AI content for the other). This is your safety net.

3. Deploy to Replit public URL.

4. Test full flow on mobile.

5. Add /stats page showing live user + capture + ask counts.

6. Fix the top 3 bugs real users hit (ship to 2 friends first).

**Milestone 5 ✓:** Live URL, polished, demo-safe.


### **Time Budget Summary**

| Phase                | Hours          |
| -------------------- | -------------- |
| 0. Setup             | 3              |
| 1. Auth + Shell      | 2              |
| 2. Capture pipeline  | 6              |
| 3. Ask/Retrieval     | 4              |
| 4. Library           | 2              |
| 5. Polish            | 4              |
| **Total build time** | **21 hours**   |
| Buffer for bugs      | 8 hours        |
| **Total needed**     | **\~29 hours** |

That fits inside the window IF the tech person starts tonight (Thursday evening, Oct 23) and works solid through Friday + Saturday morning. 12-hour hackathon day = polish + user acquisition + pitch, not building.


## **8. Prompt Library (Ready to Paste)**

Put all of these in lib/prompts.ts. Tweak only after demoing them end-to-end.


### **8.1 Summarise & Extract (used on every capture)**

You are a knowledge-extraction assistant for a personal knowledge app.\
\
The user has just saved this content:\
\---\
{RAW\_CONTENT}\
\---\
Source type: {TYPE}\
Source URL: {SOURCE\_URL}\
\
Return a strict JSON object with exactly these fields:\
{\
  "title": "a short descriptive title (max 10 words)",\
  "summary": "a 150-200 word summary capturing the key points, specific facts, numbers, names, and actionable insights. Do NOT fluff. Preserve specifics.",\
  "one\_line\_takeaway": "the single most useful thing to remember, in under 20 words",\
  "keywords": \["5-10 lowercase keywords someone would use to search this later"],\
  "entities": \["all specific proper nouns: people, companies, tools, products, places"]\
}\
\
Return ONLY the JSON. No preamble, no explanation.


### **8.2 Find Connections (after each capture is embedded)**

You are helping build a personal knowledge graph.\
\
The user just saved this new capture:\
\---\
Title: {NEW\_TITLE}\
Summary: {NEW\_SUMMARY}\
Keywords: {NEW\_KEYWORDS}\
\---\
\
Here are 5 existing captures the user previously saved that are semantically similar:\
{FOR\_EACH\_CANDIDATE:\
\[ID: {ID}]\
Title: {TITLE}\
Summary: {SUMMARY}\
}\
\
For each candidate, decide if it is GENUINELY related to the new capture (not just vaguely similar).\
Two captures are genuinely related if they: discuss the same person/company/tool, build on each other's ideas, contradict each other, or would be useful to recall together.\
\
Return a strict JSON array:\
\[\
  { "id": "candidate-id", "related": true/false, "reason": "one short sentence why" }\
]\
\
Return ONLY the JSON array.


### **8.3 The Ask Prompt (the main retrieval → synthesis call)**

You are the user's Second Brain — an AI that combines what the user has personally learned with your general knowledge to help them complete tasks.\
\
The user's task:\
\---\
{USER\_TASK}\
\---\
\
Output mode: {MODE}\
{MODE\_INSTRUCTIONS}  <-- see 8.4 for mode-specific text\
\
\[FROM USER'S PERSONAL KNOWLEDGE — things they have specifically dumped into their Second Brain]:\
{FOR\_EACH\_RETRIEVED\_CAPTURE:\
\---\
Saved from: {SOURCE\_URL or 'typed note'} on {DATE}\
\[Capture #{INDEX}]\
{SUMMARY}\
(key entities: {ENTITIES})\
}\
\
Rules:\
1\. Lean HEAVILY on the user's personal knowledge above. These are things they specifically chose to remember.\
2\. When you use something from their personal knowledge, mark it inline like \[#2] referring to the capture index.\
3\. Combine their personal knowledge with your general knowledge to produce the best possible output for the task.\
4\. If their personal knowledge is irrelevant to the task, say so briefly and give a general-knowledge answer.\
5\. Be specific, actionable. No fluff.\
6\. If MODE is 'Draft Email', output only the email body (subject line on first line prefixed with 'Subject: '). If 'Make Outline', output a nested bullet outline. If 'Action Steps', output a numbered list of concrete steps. If 'Full Prep Brief', output sections: Context / What You Know / Suggested Approach / Risks / Opening Lines.\
\
Produce the output now.


### **8.4 Mode-Specific Instructions (inject into {MODE\_INSTRUCTIONS})**

| Mode            | Instruction                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Answer          | Produce a direct, well-reasoned answer. 2-5 paragraphs max.                                                                                              |
| Draft Email     | Draft a complete email. First line: Subject: \<subject>. Then blank line, then body. Professional but human tone.                                        |
| Make Outline    | Produce a nested bullet outline. Max 3 levels deep. Each top-level item is a clear phase/section.                                                        |
| Action Steps    | Produce a numbered list of 5-10 concrete, specific action steps the user can execute today. Include who to contact, what to send, what to decide.        |
| Full Prep Brief | Produce sections with headers: ## Context, ## What You Know About This, ## Suggested Approach, ## Risks & Things to Watch, ## Opening Lines You Can Use. |


### **8.5 Model Choice**

- Section 8.1 (summarise): use **Claude Haiku 4** — cheap, fast, sufficient.

- Section 8.2 (connections): use **Claude Haiku 4** — simple classification.

- Section 8.3 (synthesis): use **Claude Sonnet 4** — this is the moment that must sing.


## **9. Optional Features (Build After Hackathon)**

**Do NOT build any of these during the 36-hour window. They are the roadmap we show investors / judges to prove we see the full vision.**


### **Priority 1 — Build in Week 2-4 after hackathon**

- **Voice input (Hindi + English + Hinglish).** User can record a voice note from phone or web. Transcribed via Deepgram, Sarvam AI, or Whisper. Treated as a text capture. **Why important:** this is the India wedge.

- **WhatsApp bot ingestion.** User forwards anything to a WhatsApp number; it lands in their Second Brain. Massive distribution advantage in India.

- **PDF ingestion.** User uploads a PDF; app extracts text and ingests. Useful for students, researchers, consultants.

- **Instagram Reel / TikTok ingestion.** User pastes a reel URL; app downloads the video, transcribes audio via Whisper, ingests. Short-form was named as a specialty in the user's vision.

- **Chrome extension for highlight-to-save.** Select any text on any webpage, right-click → "Save to Second Brain".


### **Priority 2 — Build in Month 2**

- **Image / screenshot capture + OCR.** Screenshot a slide, meme, or whiteboard; app extracts text + visual summary.

- **Audio file upload.** Podcast MP3, voice memo files — transcribed and ingested.

- **Email forwarding.** Forward any email to save\@secondbrain.app and it's ingested.

- **Multi-step execution.** When a workflow has steps that touch other tools (Gmail, Calendar, Notion, Google Docs), app can actually execute them with user approval per step. This is the TRUE execution layer.

- **Reminders / proactive surfacing.** App notices you have a calendar meeting with someone it has notes on; sends a push notification 15 min before: _"Here's what you know about Rajesh."_


### **Priority 3 — Build in Month 3+**

- **Browser extension that watches context.** When you have a Gmail compose window open or a Google Doc, extension silently surfaces: _"3 things from your Brain are relevant to what you're writing."_ This is the Clicky/Rewind-style ambient layer.

- **Mobile app (iOS + Android).** Native share sheet integration: share anything from any app → saved to Second Brain.

- **Collaboration (optional B2B play).** Share a specific capture or a whole "brain" with a teammate. Explicitly OUT of scope for the B2C hackathon product.

- **Marketplace of pre-built Brains.** Users can download "Starter Brains" curated by experts (e.g., "Sales Mastery Brain" with top 500 sales resources pre-ingested).

- **API for other apps.** Let third-party apps query a user's brain with their consent. Similar to Fabric's API strategy.


### **What we deliberately will NOT build (ever, or at least v1)**

- Any collaboration / shared workspace features (keeps the product simple and personal).

- Any enterprise admin controls (phase 2 revenue stream, out of core scope).

- A full agentic auto-executor that acts without approval (safety + trust problem).

- Our own LLM (we are a product on top of Claude/OpenAI, not a model company).


## **10. Edge Cases & Risks (Handle These)**

### **10.1 Ingestion Edge Cases**

- **YouTube video has no transcript / is in a non-English language.** Show error: _"We couldn't auto-transcribe this video. Paste a summary yourself?"_ and open a text input.

- **URL is behind a paywall or Cloudflare.** Catch the fetch error. Show error: _"This page is blocking us. Paste the content you want to save instead."_

- **Content is extremely long (10,000+ words).** Truncate to first 15,000 characters before sending to Claude for summary (should still capture the gist). Store full raw content in DB.

- **User dumps the same URL twice.** Detect by source\_url match → confirm with the user: _"You already saved this on \<date>. Save again anyway?"_

- **User dumps gibberish.** Claude will produce a weak summary. Not a problem — let it be. Users will self-correct.


### **10.2 Retrieval Edge Cases**

- **User's library is empty when they ask something.** App should still answer using Claude's general knowledge, with a line: _"Your Brain is empty on this topic yet — here's my general knowledge answer. Save some sources about this and I'll get smarter."_

- **Vector search returns nothing above threshold.** Fall back to keyword search on entities + keywords. If still nothing, answer from general knowledge with the empty-library message.

- **Claude API returns an error / times out.** Retry once. If still fails, show: _"Claude is slow right now. Try again in a few seconds."_ with a retry button.


### **10.3 Security / Privacy Risks**

- **User's data must stay private.** Row-level security (Section 5.3) is non-negotiable. Verify with a test: sign in as user A, try to query user B's captures via the API — should return empty.

- **API keys must never ship to the browser.** Only use supabase.anon.key client-side. service\_role + ANTHROPIC\_API\_KEY + OPENAI\_API\_KEY are server-side only (in Next.js API routes).

- **Google OAuth redirect URL must be set correctly** in both Google Cloud Console and Supabase. Mismatch = silent sign-in failure.


### **10.4 Demo-Day Risks**

- **Venue WiFi dies.** Pre-record a 90-second video walkthrough as backup. Play if live demo fails.

- **Supabase or Anthropic has an outage.** Pre-populated demo accounts (with captures already made) means the Ask flow still works even if capture pipeline is down. Build captures Friday night, don't rely on live capture at the venue.

- **Loading time scares judges.** Every operation should show a loading state within 100ms. Vector search + Claude call should feel like <5 seconds total.

- **Judges don't believe the sources are real.** Always show the "Sources" accordion with clickable links back to the original YouTube video / URL. Trust is built on verifiability.


### **10.5 Legal / Policy**

- **Fetching YouTube transcripts and web article text** is generally fine for personal/educational use (we're not republishing). Don't publicise this as a feature in press / investor outreach without a lawyer review.

- **Users could dump copyrighted content.** Add a line in Terms (even a 1-page terms doc) saying the user is responsible for what they capture.

- **Data retention.** Clarify in UI: _"Your Brain is private. We don't train AI on your data."_ This matters for trust.


## **11. Demo Script for Judging Day**

Build toward this script. If you can nail this, you win.

**Total pitch time: \~3 minutes. Demo = 90 seconds of that.**


### **The Script (word for word)**

**\[0:00 - 0:20] Hook**

_"Quick question: how many times this week did you think 'I know I learned this somewhere, I just can't remember where'? That's the problem. Not finding information — remembering what we already learned."_

**\[0:20 - 0:40] Problem framing**

_"We save 100 reels, bookmark 50 tweets, watch 20 YouTube videos. Three months later, when we actually need any of it, it's gone. We re-google. We re-watch. We waste time." "Existing tools — Notion, Obsidian — ask you to organize. People quit because the organizing becomes a second job."_

**\[0:40 - 2:10] LIVE DEMO (90 seconds)**

_Have 2 demo accounts pre-loaded. Account A has 15 captures about Indian startup investors. Account B has 15 captures about building AI products._

_"Let me show you. \[Share screen with Account A logged in.]" "I've been networking with investors. Every time I learn something — I just dump it here."_ **_\[LIVE: paste a new YouTube link from an investor podcast → hit Send → 20 seconds later show it absorbed + connected to 3 past captures. Pause here. Let it land.]_** _"It just read a 40-minute podcast and connected it to 3 things I already knew. Watch what happens when I actually have a task."_ **_\[Switch to Ask tab. Type: "I have a meeting tomorrow with Rajesh from Accel. Help me prep." Select mode: Full Prep Brief. Hit Ask.]_** __**_\[\~10 seconds. Output appears: a prep brief with context about Rajesh pulled from past captures, suggested approach, opening lines.]_** _"Notice this — it's not just general advice about pitching Accel. It knows what I personally learned about Rajesh. His investment thesis. The two edtech bets he made last year. The fact he hates buzzwords. These came from the podcast I just added and 3 other things I'd saved over months."_ **_\[Click Sources accordion. Show the actual captures that fed the answer.]_** _"Then — I hit Draft Email mode."_ **_\[Switch mode to Draft Email. Click Ask again. Email appears.]_** __**_\[Click "Open in Gmail" button. Gmail compose opens with the draft prefilled.]_** _"That's the loop. Dump. Connect. Execute."_

**\[2:10 - 2:40] Why we win**

_"Three things make us different. One — we work in Hindi too, so 500 million Indian learners who can't use Notion can finally have a second brain. Two — we don't just answer, we execute. Three — we're priced for India at ₹299 a month, not $20."_

**\[2:40 - 3:00] Traction + Ask**

_"In the 8 hours since we launched this at the venue, \[X] people have signed up. \[Y] captures have been made. The product is live right now at \[URL] — scan this QR to try it in 30 seconds." "We're looking for seed investors who want to back the second brain built for the next billion learners. Thank you."_


### **What to have ready on-screen during pitch**

1. **Tab 1:** Account A dashboard, logged in, Dump tab, ready to paste a new YouTube link.

2. **Tab 2:** Account A Ask tab, cursor in input box.

3. **Tab 3:** Gmail compose window (not opened yet).

4. **Tab 4:** /stats page showing live counts.

5. **Backup video:** 90-sec screen recording of the full flow. Play if WiFi dies.


### **Judging Rubric Mapping (from Airtribe)**

| Criterion                         | Weight | How this demo scores                                                               |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Challenge-Solution Fit            | 20%    | Direct hit: Track 1 is "AI for Learning". We ARE learning retention + application. |
| AI Leverage & Technical Execution | 25%    | Live demo of RAG + multi-call synthesis. If it works, 20+/25.                      |
| Product Thinking & UI/UX          | 20%    | 3-tab clean UI, instant loading states, visible connections.                       |
| Originality & Insight             | 20%    | Reframe from "remember" to "stop having to remember" + execution layer.            |
| Evidence of Real Demand           | 15%    | Live counter of users signed up during event. 20+ real users = full marks.         |


## **12. Acceptance Criteria (How We Know It's Done)**

The tech person can mark a feature "done" ONLY when every checkbox below passes. No partial credit.


### **12.1 Authentication — Done When:**

- ☐ A new user can click "Try Free with Google" on the landing page and reach the dashboard in under 10 seconds.

- ☐ Refreshing the dashboard page keeps the user signed in.

- ☐ Signing out returns the user to the landing page.

- ☐ Opening the app in a different browser requires sign-in again.


### **12.2 Capture — Done When:**

- ☐ Pasting a YouTube link + clicking Send produces a confirmation card within 60 seconds showing: title, one-line takeaway, and (if any) a list of connected prior captures.

- ☐ The same works for an article URL.

- ☐ The same works for pasted plain text.

- ☐ The capture appears in the My Brain tab immediately.

- ☐ If I open the capture detail, I see the full 150-200 word summary + keywords + source link.

- ☐ If I had captured 5 YouTube videos on the same topic, the 6th shows connections to 2-3 of them.


### **12.3 Ask — Done When:**

- ☐ Typing a task in natural language and hitting Ask returns a response within 15 seconds.

- ☐ The response visibly references specific facts from my past captures (e.g., name of a person I mentioned, number I saved).

- ☐ Switching Mode from Answer to Draft Email changes the output format to a complete email.

- ☐ The Sources accordion lists the captures used, each clickable to the original source URL.

- ☐ For Draft Email mode, clicking "Open in Gmail" opens Gmail compose with the draft prefilled.

- ☐ Asking a task completely unrelated to any saved capture returns a general answer with the note _"Your Brain is empty on this topic — here's my general knowledge answer."_


### **12.4 Library — Done When:**

- ☐ My Brain tab lists every capture I've made, newest first.

- ☐ Each row shows source type icon, title, takeaway, date.

- ☐ Clicking a row opens a modal with the full capture details.

- ☐ The keyword search bar filters results in real time as I type.

- ☐ Deleting a capture removes it immediately and also removes it from any future retrievals.


### **12.5 Non-Functional — Done When:**

- ☐ App is deployed to a public HTTPS URL (not localhost).

- ☐ First page load is under 3 seconds on 4G.

- ☐ All text is readable on a mobile phone portrait viewport.

- ☐ No raw error messages or stack traces are ever shown to users.

- ☐ No API keys appear in browser DevTools Network tab or source.

- ☐ A test user signed in as User A cannot see any data from User B when calling API endpoints directly.


### **12.6 Pre-Demo Checklist (Sunday morning before pitch)**

- ☐ 2 demo accounts pre-populated with 15+ captures each.

- ☐ 90-second backup demo video recorded and saved offline.

- ☐ /stats page shows live counters.

- ☐ Landing page GIF plays in a loop.

- ☐ QR code generated for the live URL, printed and ready.

- ☐ All 4 browser tabs preloaded (per Section 11).

- ☐ Pitch script rehearsed 5 times, under 3 minutes each time.

**That's the spec. Build to this. Nothing more, nothing less — unless we talk and agree to change something.**
