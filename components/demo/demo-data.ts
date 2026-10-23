/**
 * Deterministic content for the landing-page demo. Nothing here talks to a backend: it is sample data
 * that walks through one story (preparing for a seed meeting) the same way on every visit.
 * The people and notes are illustrative and only appear inside the demo UI.
 */

export const STAGE_IDS = ["capture", "understand", "connect", "ask", "recall", "create"] as const;
export type StageId = (typeof STAGE_IDS)[number];

export type AppTab = "dump" | "ask";

export interface Stage {
  id: StageId;
  label: string;
  /** How long the stage holds during a full play-through, in ms. */
  duration: number;
  tab: AppTab;
}

export const STAGES: readonly Stage[] = [
  { id: "capture", label: "Capture", duration: 2800, tab: "dump" },
  { id: "understand", label: "Understand", duration: 3400, tab: "dump" },
  { id: "connect", label: "Connect", duration: 3000, tab: "dump" },
  { id: "ask", label: "Ask", duration: 2400, tab: "ask" },
  { id: "recall", label: "Recall", duration: 3000, tab: "ask" },
  { id: "create", label: "Create", duration: 4000, tab: "ask" },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, Stage>;

export function stageIndex(id: StageId): number {
  return STAGE_IDS.indexOf(id);
}

/** Stages up to and including `id`, as the space-separated list the CSS reads from data-reached. */
export function reachedThrough(id: StageId): string {
  return STAGE_IDS.slice(0, stageIndex(id) + 1).join(" ");
}

/**
 * When each beat happens inside its stage, in ms from the start of the stage. The CSS reads these
 * through the --d custom property, scaled by --tempo.
 */
export const BEATS = {
  capture: { link: 250, send: 1000, slot: 1250, card: 1400 },
  understand: { title: 250, summary: [850, 1450], takeaway: 2050, keywords: 2550 },
  connect: { arc: 300, arcGap: 350, done: 1500, confirm: 1650, pill: 1850, pillGap: 150 },
  ask: { task: 350, mode: 650, press: 1500 },
  recall: { first: 200, gap: 250, checked: 1300, general: 1400, combined: 2400 },
  create: { firstRow: 350, rowGap: 600, compare: 3000 },
} as const;

export type CaptureId = "podcast" | "metrics" | "numbers" | "edtech" | "review" | "thesis";
export type CaptureKind = "youtube" | "article" | "note" | "tweet";

export const KIND_LABEL: Record<CaptureKind, string> = {
  youtube: "YouTube",
  article: "Article",
  note: "Typed note",
  tweet: "Tweet",
};

export interface Capture {
  id: CaptureId;
  kind: CaptureKind;
  title: string;
  /** Label used on source chips. */
  short: string;
  /** ISO date the capture was saved; the new capture is saved "today" during the demo. */
  savedOn: string | null;
}

/** My Brain, newest first. The first entry is the capture the demo adds. */
export const CAPTURES: readonly Capture[] = [
  { id: "podcast", kind: "youtube", title: "Seed round prep: what investors check first", short: "Seed prep podcast", savedOn: null },
  { id: "metrics", kind: "note", title: "Our October numbers: 1,240 paying learners, +18% a month", short: "Your October numbers", savedOn: "2026-10-02" },
  { id: "numbers", kind: "note", title: "Rajesh (Accel) prefers numbers over buzzwords", short: "Rajesh prefers numbers", savedOn: "2026-09-12" },
  { id: "edtech", kind: "note", title: "Rajesh has invested in two edtech startups", short: "Rajesh’s edtech bets", savedOn: "2026-08-30" },
  { id: "review", kind: "tweet", title: "A 15-minute weekly review: three questions every Friday", short: "Weekly review tweet", savedOn: "2026-08-02" },
  { id: "thesis", kind: "article", title: "Accel’s seed thesis: ambitious, high-growth companies", short: "Accel’s seed thesis", savedOn: "2026-07-18" },
];

export const NEW_CAPTURE_ID: CaptureId = "podcast";

export const CAPTURE_BY_ID = Object.fromEntries(CAPTURES.map((c) => [c.id, c])) as Record<CaptureId, Capture>;

// A fixed locale and time zone keep the server and the browser on the same string.
const SAVED_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function savedLabel(capture: Capture): string {
  return capture.savedOn ? SAVED_FORMAT.format(new Date(`${capture.savedOn}T00:00:00Z`)) : "Today";
}

/** What the Understand stage pulls out of the new YouTube capture. */
export const NEW_CAPTURE_INSIGHT = {
  link: "youtube.com/watch?v=seed-round-prep",
  source: "YouTube · 42 min",
  title: "Seed round prep: what investors check first",
  summary: [
    "A founder and an investor on first meetings. Investors decide early,",
    "so lead with traction, show how you will spend the round and know your retention cold.",
  ],
  takeaway: "Open with your strongest number, not your vision.",
  keywords: ["seed round", "traction", "first meetings"],
} as const;

/** Links the Connect stage draws from the new capture. Not every capture is connected. */
export const CONNECTIONS: readonly { to: CaptureId; reason: string }[] = [
  { to: "metrics", reason: "your traction figures" },
  { to: "numbers", reason: "both say lead with numbers" },
  { to: "thesis", reason: "same topic: raising a seed round" },
];

export type TaskId = "meeting" | "email" | "plan";
export type OutputMode = "Full Prep Brief" | "Draft Email" | "Action Steps";

export interface AnswerPart {
  text: string;
  /** Captures this sentence came from. */
  from?: readonly CaptureId[];
  /** Marks a sentence that comes from general AI knowledge rather than the user's Brain. */
  general?: boolean;
}

export interface AnswerRow {
  label: string;
  parts: readonly AnswerPart[];
}

export interface Task {
  id: TaskId;
  chip: string;
  prompt: string;
  mode: OutputMode;
  outputTitle: string;
  /** Captures the Recall stage lights up, in the order they appear in My Brain. */
  recalled: readonly CaptureId[];
  generalTopic: string;
  rows: readonly AnswerRow[];
  /** The same request answered without the user's Brain. */
  generic: readonly AnswerRow[];
  narration: { recall: string; create: string };
}

export const TASKS: readonly Task[] = [
  {
    id: "meeting",
    chip: "Prep for a meeting",
    prompt: "I’m meeting Rajesh from Accel tomorrow about my seed round. Help me prepare.",
    mode: "Full Prep Brief",
    outputTitle: "Prep brief: Rajesh, Accel",
    recalled: ["podcast", "metrics", "numbers", "edtech"],
    generalTopic: "Seed pitch structure",
    rows: [
      {
        label: "Context",
        parts: [{ text: "Seed-round intro. Rajesh has backed two edtech startups, so he knows your market.", from: ["edtech"] }],
      },
      {
        label: "Approach",
        parts: [
          { text: "Open with traction: 1,240 paying learners, up 18% a month.", from: ["metrics", "podcast"] },
          { text: "Skip the buzzwords; he prefers numbers.", from: ["numbers"] },
        ],
      },
      {
        label: "Risks",
        parts: [
          { text: "Expect a comparison with his edtech bets. Know your retention cold.", from: ["edtech", "podcast"] },
          { text: "Have burn and runway ready.", general: true },
        ],
      },
      {
        label: "Opening line",
        parts: [{ text: "“We grew 18% last month. Here’s what drove it.”", from: ["metrics"] }],
      },
    ],
    generic: [
      { label: "Context", parts: [{ text: "A seed meeting with a venture capital firm." }] },
      { label: "Approach", parts: [{ text: "Open with the problem you solve, then size the market." }] },
      { label: "Risks", parts: [{ text: "Investors may ask about competition." }] },
      { label: "Opening line", parts: [{ text: "“Thanks for your time. Let me share our vision.”" }] },
    ],
    narration: {
      recall: "Recall: four memories light up and flow into the task, alongside general knowledge about seed pitches.",
      create: "Create: a prep brief arrives, and every personal detail shows the capture it came from.",
    },
  },
  {
    id: "email",
    chip: "Draft an email",
    prompt: "Draft a note to Rajesh confirming tomorrow’s meeting.",
    mode: "Draft Email",
    outputTitle: "Draft email to Rajesh",
    recalled: ["podcast", "metrics", "numbers"],
    generalTopic: "Short pre-meeting emails",
    rows: [
      { label: "Subject", parts: [{ text: "Tomorrow at 11: our seed round, in numbers", from: ["numbers"] }] },
      {
        label: "Body",
        parts: [
          { text: "Hi Rajesh, looking forward to tomorrow." },
          { text: "I’ll keep it to numbers: 1,240 paying learners, growing 18% a month.", from: ["metrics", "numbers"] },
          { text: "I’ll bring cohort retention too.", from: ["podcast"] },
          { text: "Happy to send the deck beforehand.", general: true },
        ],
      },
    ],
    generic: [
      { label: "Subject", parts: [{ text: "Excited to connect!" }] },
      {
        label: "Body",
        parts: [
          {
            text: "Hi Rajesh, I hope this finds you well. We’re disrupting education with an innovative, AI-first platform, and I’d love to share our vision.",
          },
        ],
      },
    ],
    narration: {
      recall: "Recall: three memories come back, your numbers, how Rajesh likes to be pitched and the podcast you just saved.",
      create: "Create: the draft sticks to numbers, because you once noted that Rajesh prefers them.",
    },
  },
  {
    id: "plan",
    chip: "Plan a project",
    prompt: "Plan my seed round for the next six weeks.",
    mode: "Action Steps",
    outputTitle: "Seed round plan",
    recalled: ["metrics", "edtech", "review", "thesis"],
    generalTopic: "How seed rounds usually run",
    rows: [
      { label: "Week 1", parts: [{ text: "Rebuild the deck around 18% monthly growth.", from: ["metrics"] }] },
      {
        label: "Week 2",
        parts: [
          { text: "Shortlist funds that back ambitious, high-growth companies, as Accel’s seed thesis does.", from: ["thesis"] },
          { text: "Ask for warm intros.", general: true },
        ],
      },
      { label: "Weeks 3–4", parts: [{ text: "First meetings. Start with Rajesh; he knows edtech.", from: ["edtech"] }] },
      { label: "Fridays", parts: [{ text: "A 15-minute review of what each meeting taught you.", from: ["review"] }] },
    ],
    generic: [
      { label: "Week 1", parts: [{ text: "Polish your pitch deck." }] },
      { label: "Week 2", parts: [{ text: "Research investors in your space." }] },
      { label: "Weeks 3–4", parts: [{ text: "Take as many meetings as you can." }] },
      { label: "Fridays", parts: [{ text: "Follow up with every investor." }] },
    ],
    narration: {
      recall: "Recall: a different set lights up for this task, including the Accel article and a weekly-review tweet.",
      create: "Create: a six-week plan built from what you saved, with general advice marked as such.",
    },
  },
];

export const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t])) as Record<TaskId, Task>;

export const DEFAULT_TASK_ID: TaskId = "meeting";

/** Spoken by the live region when a stage starts. */
export function narrationFor(stage: StageId, task: Task): string {
  switch (stage) {
    case "capture":
      return "Capture: a YouTube link is dropped into Second Brain.";
    case "understand":
      return "Understand: it reads the video and pulls out a title, a summary and the key takeaway.";
    case "connect":
      return "Connect: the new capture is linked to three things you saved earlier.";
    case "ask":
      return `Ask: ${task.prompt}`;
    case "recall":
      return task.narration.recall;
    case "create":
      return task.narration.create;
  }
}
